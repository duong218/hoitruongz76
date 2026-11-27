import { EventSetting, Seat, Employee, Group, Attendance } from '../models/index.js';
import { audit } from '../utils/audit.js';
import { archiveAndClear, withArchiveLock } from '../utils/archive.js';
import { invalidateCachedEvent } from '../utils/memoryCache.js';

// Chỉ nhận http/https, tối đa 200 ký tự, không kèm tài khoản. Chuỗi rỗng = xóa đường dẫn.
function validateAppUrl(value) {
  if (typeof value !== 'string') return 'Địa chỉ ứng dụng phải là chuỗi.';
  const s = value.trim();
  if (s === '') return null;
  if (s.length > 200) return 'Địa chỉ ứng dụng tối đa 200 ký tự.';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Địa chỉ ứng dụng chỉ được bắt đầu bằng http:// hoặc https://.';
    if (u.username || u.password) return 'Địa chỉ ứng dụng không được chứa tên đăng nhập hoặc mật khẩu.';
    return null;
  } catch {
    return 'Địa chỉ ứng dụng không hợp lệ.';
  }
}

// Giờ ISO -> Date. Rỗng/null -> null. Sai định dạng -> undefined.
function readTime(v) {
  if (v === null || v === '') return null;
  const d = typeof v === 'string' ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

// Trả thông báo lỗi nếu khung giờ vô lý, ngược lại null
function windowError(opensAt, closesAt) {
  if (!opensAt || !closesAt) return null;
  if (closesAt <= opensAt) return 'Giờ đóng phải sau giờ mở.';
  if (closesAt - opensAt > 7 * 24 * 3600 * 1000) return 'Khung giờ sự kiện dài quá 7 ngày, hãy kiểm tra lại ngày giờ.';
  return null;
}

export const eventController = {
  // Cài đặt sự kiện (công khai). KHÔNG chứa token ghế.
  async getSettings(req, res, next) {
    try {
      let event = await EventSetting.getMain();
      if (!event) {
        event = await EventSetting.upsertMain({
          eventName: 'Hội nghị Triển khai Nhiệm vụ Z176',
          guestEnabled: true,
          checkInOpen: true,
          appUrl: '',
        });
      }
      res.json(event);
    } catch (err) {
      next(err);
    }
  },

  // Token ghế (chỉ ADMIN / MANAGER, dùng để in QR)
  async getSeatTokens(req, res, next) {
    try {
      const seats = await Seat.findAll({ includeToken: true });
      const seatTokens = {};
      seats.forEach((s) => {
        seatTokens[s.seatId] = s.token;
      });
      res.json({ seatTokens });
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật cài đặt sự kiện
  async updateSettings(req, res, next) {
    try {
      const { eventName, guestEnabled, checkInOpen, appUrl } = req.body;
      const bad = (message) => res.status(400).json({ message });
      if (eventName !== undefined && (typeof eventName !== 'string' || !eventName.trim() || eventName.trim().length > 150)) {
        return bad('Tên sự kiện phải là chữ, từ 1 đến 150 ký tự.');
      }
      if (guestEnabled !== undefined && typeof guestEnabled !== 'boolean') return bad('guestEnabled phải là true hoặc false.');
      if (checkInOpen !== undefined && typeof checkInOpen !== 'boolean') return bad('checkInOpen phải là true hoặc false.');
      if (appUrl !== undefined) {
        const urlError = validateAppUrl(appUrl);
        if (urlError) return bad(urlError);
      }
      let event = await EventSetting.getMain();
      if (!event) {
        event = await EventSetting.upsertMain({});
      }

      const updates = {};
      if (eventName !== undefined && eventName.trim() !== event.eventName) {
        if (event.nameLocked) {
          return res.status(400).json({ message: 'Sự kiện đã bắt đầu nên không thể đổi tên. Hãy bấm "Bắt đầu sự kiện mới" nếu muốn tạo sự kiện khác.' });
        }
        updates.eventName = eventName.trim();
      }
      if (guestEnabled !== undefined) updates.guestEnabled = guestEnabled;
      if (checkInOpen !== undefined) updates.checkInOpen = checkInOpen;
      if (appUrl !== undefined) updates.appUrl = appUrl.trim();

      const updatedEvent = await EventSetting.upsertMain(updates);
      invalidateCachedEvent();
      const parts = [];
      if (eventName !== undefined) parts.push('đổi tên sự kiện');
      if (guestEnabled !== undefined) parts.push(`khách mời=${guestEnabled ? 'bật' : 'tắt'}`);
      if (checkInOpen !== undefined) parts.push(`điểm danh=${checkInOpen ? 'mở' : 'đóng'}`);
      if (appUrl !== undefined) parts.push('đổi đường dẫn');
      await audit(req, 'event.update', `Cập nhật sự kiện: ${parts.join(', ') || 'không đổi gì'}`);
      res.json(updatedEvent);
    } catch (err) {
      next(err);
    }
  },

  // Bắt đầu sự kiện mới: xóa điểm danh sự kiện cũ, đặt tên mới và khóa tên.
  // Điểm danh cũ được lưu vào lịch sử (chỉ xem/xuất Excel), không điểm danh hộ được nữa.
  async startNew(req, res, next) {
    try {
      const name = typeof req.body.eventName === 'string' ? req.body.eventName.trim() : '';
      if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên sự kiện mới.' });
      if (name.length > 150) return res.status(400).json({ message: 'Tên sự kiện tối đa 150 ký tự.' });
      // Mỗi sự kiện mới bắt buộc có giờ mở và giờ đóng (kiểm tra trước khi lưu lịch sử và xóa điểm danh cũ)
      const opensAt = readTime(req.body.opensAt);
      const closesAt = readTime(req.body.closesAt);
      if (!opensAt || !closesAt) return res.status(400).json({ message: 'Vui lòng nhập giờ mở và giờ đóng của sự kiện mới.' });
      const windowMsg = windowError(opensAt, closesAt);
      if (windowMsg) return res.status(400).json({ message: windowMsg });
      if (opensAt < new Date(Date.now() - 60 * 1000)) return res.status(400).json({ message: 'Giờ mở không được nằm trong quá khứ. Hãy chọn từ thời điểm hiện tại trở đi.' });
      if (closesAt <= new Date()) return res.status(400).json({ message: 'Giờ đóng đã qua. Hãy chọn giờ đóng sau thời điểm hiện tại.' });
      // 3 công tắc của sự kiện mới (không gửi thì giữ nguyên)
      const { guestEnabled, checkInOpen, seatMode } = req.body;
      if ((guestEnabled !== undefined && typeof guestEnabled !== 'boolean') || (checkInOpen !== undefined && typeof checkInOpen !== 'boolean')) {
        return res.status(400).json({ message: 'Công tắc khách mời / điểm danh phải là true hoặc false.' });
      }
      if (seatMode !== undefined && !['group', 'individual'].includes(seatMode)) return res.status(400).json({ message: 'Chế độ xếp chỗ không hợp lệ.' });
      const event = await withArchiveLock(async () => {
        let ev = await EventSetting.getMain();
        if (!ev) ev = await EventSetting.upsertMain({});
        const oldName = ev.eventName;
        // Lưu lịch sử trước, xóa sau. Lưu lỗi thì ném lỗi, sự kiện cũ còn nguyên.
        const archived = await archiveAndClear(req, 'start_new');
        const modeChanged = seatMode !== undefined && seatMode !== ev.seatMode;
        const updates = {
          eventName: name,
          nameLocked: true,
          startedAt: new Date(),
          opensAt,
          closesAt,
          endHandledAt: null,
          archivedId: null,
        };
        if (guestEnabled !== undefined) updates.guestEnabled = guestEnabled;
        if (checkInOpen !== undefined) updates.checkInOpen = checkInOpen;
        if (seatMode !== undefined) updates.seatMode = seatMode;
        const savedEv = await EventSetting.upsertMain(updates);
        if (modeChanged) await Seat.clearAllAssignments();
        invalidateCachedEvent();
        await audit(
          req,
          'event.start_new',
          `Bắt đầu sự kiện mới "${name}"${modeChanged ? ' (đổi chế độ xếp chỗ, đã làm trống toàn bộ chỗ)' : ''} (giờ ${opensAt.toISOString()} - ${closesAt.toISOString()}; sự kiện trước "${oldName || ''}": ${archived ? `đã lưu lịch sử ${archived.summary.checked} lượt điểm danh` : 'không có ai điểm danh nên không lưu'})`
        );
        return savedEv;
      });
      res.json(event);
    } catch (err) {
      next(err);
    }
  },

  // Thống kê công khai cho màn hình trình chiếu (TV / Máy chiếu): không lộ thông tin cá nhân
  async getLiveStats(req, res, next) {
    try {
      const [employees, groups, attendance, seats] = await Promise.all([
        Employee.findAll(),
        Group.findAll(),
        Attendance.findAll(),
        Seat.findAll(),
      ]);
      const checkedCodes = new Set(attendance.map((a) => a.employeeCode.toUpperCase()));
      const empByCode = new Map(employees.map((e) => [e.code.toUpperCase(), e]));
      let requiredCount = 0;
      let checkedInCount = 0;
      employees.forEach((emp) => {
        if (emp.role !== 'EMPLOYEE') return;
        const g = groups.find((grp) => Array.isArray(grp.blockIds) && grp.blockIds.includes(emp.blockId));
        if (g && g.checkInRequired) {
          requiredCount++;
          if (checkedCodes.has(emp.code.toUpperCase())) checkedInCount++;
        }
      });
      // Map ghế cố định -> groupId của người ngồi ghế đó (không lộ tên/mã NV)
      const personalSeatGroups = {};
      seats.forEach((s) => {
        if (!s.employeeCode) return;
        const emp = empByCode.get(s.employeeCode.toUpperCase());
        const g = emp && groups.find((grp) => Array.isArray(grp.blockIds) && grp.blockIds.includes(emp.blockId));
        if (g) personalSeatGroups[s.seatId] = g.id;
      });
      const occupiedSeats = [...new Set(attendance.map((a) => a.seatId).filter(Boolean))];
      res.json({ requiredCount, checkedInCount, occupiedSeats, personalSeatGroups });
    } catch (err) {
      next(err);
    }
  },
};