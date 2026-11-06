import { EventSetting, Seat } from '../models/index.js';
import { audit } from '../utils/audit.js';
import { archiveAndClear, withArchiveLock } from '../utils/archive.js';

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

export const eventController = {
  // Cài đặt sự kiện (công khai). KHÔNG chứa token ghế.
  async getSettings(req, res, next) {
    try {
      let event = await EventSetting.findOne({ key: 'main' });
      if (!event) {
        event = await EventSetting.create({
          key: 'main',
          eventName: 'Hội nghị Triển khai Nhiệm vụ Z176',
          guestEnabled: true,
          checkInOpen: true,
          appUrl: '',
        });
      }
      res.json(event.toJSON());
    } catch (err) {
      next(err);
    }
  },

  // Token ghế (chỉ ADMIN / MANAGER, dùng để in QR)
  async getSeatTokens(req, res, next) {
    try {
      const seats = await Seat.find().select('+token');
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
      let event = await EventSetting.findOne({ key: 'main' });
      if (!event) {
        event = new EventSetting({ key: 'main' });
      }

      if (eventName !== undefined && eventName.trim() !== event.eventName) {
        if (event.nameLocked) {
          return res.status(400).json({ message: 'Sự kiện đã bắt đầu nên không thể đổi tên. Hãy bấm \"Bắt đầu sự kiện mới\" nếu muốn tạo sự kiện khác.' });
        }
        event.eventName = eventName.trim();
      }
      if (guestEnabled !== undefined) event.guestEnabled = guestEnabled;
      if (checkInOpen !== undefined) event.checkInOpen = checkInOpen;
      if (appUrl !== undefined) event.appUrl = appUrl.trim();

      await event.save();
      const parts = [];
      if (eventName !== undefined) parts.push('đổi tên sự kiện');
      if (guestEnabled !== undefined) parts.push(`khách mời=${guestEnabled ? 'bật' : 'tắt'}`);
      if (checkInOpen !== undefined) parts.push(`điểm danh=${checkInOpen ? 'mở' : 'đóng'}`);
      if (appUrl !== undefined) parts.push('đổi đường dẫn');
      await audit(req, 'event.update', `Cập nhật sự kiện: ${parts.join(', ') || 'không đổi gì'}`);
      res.json(event.toJSON());
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
      const event = await withArchiveLock(async () => {
        let ev = await EventSetting.findOne({ key: 'main' });
        if (!ev) ev = new EventSetting({ key: 'main' });
        const oldName = ev.eventName;
        // Lưu lịch sử trước, xóa sau. Lưu lỗi thì ném lỗi, sự kiện cũ còn nguyên.
        const archived = await archiveAndClear(req, 'start_new');
        ev.eventName = name;
        ev.nameLocked = true;
        ev.startedAt = new Date();
        await ev.save();
        await audit(
          req,
          'event.start_new',
          `Bắt đầu sự kiện mới "${name}" (sự kiện trước "${oldName || ''}": ${archived ? `đã lưu lịch sử ${archived.summary.checked} lượt điểm danh` : 'không có ai điểm danh nên không lưu'})`
        );
        return ev;
      });
      res.json(event.toJSON());
    } catch (err) {
      next(err);
    }
  },
};
