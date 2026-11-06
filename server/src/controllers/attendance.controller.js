import { Attendance, Seat, EventSetting, Employee, Group } from '../models/index.js';
import { ROLES } from '../constants/roles.server.js';
import { audit } from '../utils/audit.js';
import { archiveAndClear, withArchiveLock } from '../utils/archive.js';

export const attendanceController = {
  // Lấy danh sách điểm danh
  // Quản trị/quản lý xem tất cả; nhân viên chỉ thấy của mình; khách mời không có gì.
  async getAll(req, res, next) {
    try {
      const { user } = req;
      const isStaff = user && (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER);
      if (!user) return res.json([]);
      const filter = isStaff ? {} : { employeeCode: user.code };
      const list = await Attendance.find(filter).sort({ checkedInAt: -1 });
      res.json(list);
    } catch (err) {
      next(err);
    }
  },

  // Điểm danh
  async checkIn(req, res, next) {
    try {
      let { seatId, token } = req.body;
      // Mã nhân viên lấy từ phiên đăng nhập, không tin dữ liệu client gửi lên
      const code = req.user.code;

      const trimmedToken = typeof token === 'string' ? token.trim().toUpperCase() : '';

      if (!trimmedToken) {
        return res.status(400).json({ message: 'Thiếu mã tem ghế. Hãy nhập mã 6 ký tự in trên tem hoặc quét QR.' });
      }

      // 1. Kiểm tra sự kiện đã mở điểm danh chưa
      const event = await EventSetting.findOne({ key: 'main' });
      if (event && !event.checkInOpen) {
        return res.status(400).json({ message: 'Chưa mở điểm danh. Vui lòng chờ ban tổ chức.' });
      }

      // 2. Tìm nhân viên
      const employee = await Employee.findOne({ code });
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên.' });
      }

      // 3. Tìm nhóm của nhân viên
      const groups = await Group.find();
      const group = employee.blockId
        ? groups.find((g) => Array.isArray(g.blockIds) && g.blockIds.includes(employee.blockId))
        : null;

      if (!group || !group.checkInRequired || employee.role === ROLES.GUEST) {
        return res.status(400).json({ message: 'Nhóm của bạn không yêu cầu điểm danh.' });
      }

      // 4. Tìm và kiểm tra ghế:
      // - Nếu có seatId: kiểm tra trực tiếp ghế đó và token khớp không
      // - Nếu không có seatId (người dùng chỉ gõ mã token): tra cứu ghế theo token
      let seat;
      if (typeof seatId === 'string' && seatId.trim()) {
        seat = await Seat.findOne({ seatId: seatId.trim() }).select('+token');
        if (!seat) {
          return res.status(400).json({ message: `Không tìm thấy ghế "${seatId}" trong hội trường.` });
        }
        if (!seat.token || trimmedToken !== seat.token.trim().toUpperCase()) {
          return res.status(400).json({ message: 'Mã QR không khớp với ghế này. Hãy quét đúng mã dán trên ghế.' });
        }
      } else {
        seat = await Seat.findOne({ token: trimmedToken }).select('+token');
        if (!seat) {
          return res.status(400).json({ message: 'Mã ghế không hợp lệ hoặc không tồn tại trong hội trường. Vui lòng kiểm tra lại 6 ký tự trên tem.' });
        }
        seatId = seat.seatId;
      }

      // 5. Kiểm tra ghế có thuộc nhóm của nhân sự không
      if (!seat.groupId || seat.groupId !== group.id) {
        return res.status(400).json({
          message: `Ghế "${seat.seatId}" không thuộc khu vực của nhóm bạn (${group.name}). Hãy tới đúng hàng ghế được phân bổ.`,
        });
      }

      // 6. Kiểm tra đã điểm danh chưa
      const existing = await Attendance.findOne({ employeeCode: code });
      if (existing) {
        return res.status(409).json({
          message: 'Bạn đã điểm danh rồi.',
          checkedInAt: existing.checkedInAt,
          seatId: existing.seatId,
        });
      }

      let newRecord;
      try {
        newRecord = await Attendance.create({
          employeeCode: code,
          seatId: seat.seatId,
          checkedInAt: new Date(),
        });
      } catch (err) {
        // Bấm hai lần cùng lúc: bản ghi thứ hai bị chặn bởi chỉ mục unique
        if (err.code === 11000) {
          return res.status(409).json({ message: 'Bạn đã điểm danh rồi.' });
        }
        throw err;
      }

      res.status(201).json(newRecord);
    } catch (err) {
      next(err);
    }
  },

  // Điểm danh hộ bởi Quản lý/Quản trị viên (dành cho người quên điện thoại, hỏng cam)
  async manualCheckInByStaff(req, res, next) {
    try {
      const { employeeCode, seatId, reason } = req.body;
      const targetCode = (employeeCode || '').trim().toUpperCase();
      const targetSeatId = (seatId || '').trim();
      const cleanReason = (reason || '').trim();
      if (!cleanReason) {
        return res.status(400).json({ message: 'Vui lòng nhập lý do điểm danh hộ.' });
      }

      if (!targetCode) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã nhân sự cần điểm danh.' });
      }

      // 1. Tìm thông tin nhân viên
      const employee = await Employee.findOne({ code: targetCode });
      if (!employee) {
        return res.status(404).json({ message: `Không tìm thấy nhân sự có mã "${targetCode}".` });
      }

      // 2. Kiểm tra đã điểm danh chưa
      const existing = await Attendance.findOne({ employeeCode: targetCode });
      if (existing) {
        return res.status(409).json({
          message: `Nhân sự "${employee.name}" (${targetCode}) đã được điểm danh trước đó tại ghế ${existing.seatId}.`,
          checkedInAt: existing.checkedInAt,
          seatId: existing.seatId,
        });
      }

      // 3. Ghế là tùy chọn; nếu nhập thì phải tồn tại. Không tự gán ghế giả.
      if (targetSeatId && !(await Seat.findOne({ seatId: targetSeatId }))) {
        return res.status(400).json({ message: `Ghế \"${targetSeatId}\" không tồn tại trong hội trường.` });
      }

      const newRecord = await Attendance.create({
        employeeCode: targetCode,
        seatId: targetSeatId,
        method: 'PROXY',
        checkedInBy: req.user.code,
        reason: cleanReason,
        checkedInAt: new Date(),
      });

      // Ghi nhật ký kiểm toán hành động điểm danh hộ
      await audit(
        req,
        'attendance.manual_checkin',
        `Điểm danh hộ cho [${targetCode}] ${employee.name}${targetSeatId ? ` tại ghế ${targetSeatId}` : ''} (Lý do: ${cleanReason})`
      );

      res.status(201).json({
        message: `Đã điểm danh hộ thành công cho ${employee.name} (${targetCode}).`,
        record: newRecord,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Nhân sự này đã được điểm danh rồi.' });
      }
      next(err);
    }
  },

  // Đặt lại điểm danh sự kiện HIỆN TẠI. body.save === true: lưu lịch sử trước rồi mới xóa.
  async reset(req, res, next) {
    try {
      const save = req.body?.save === true;
      const out = await withArchiveLock(async () => {
        if (save) {
          const archive = await archiveAndClear(req, 'reset');
          await audit(
            req,
            'attendance.reset',
            archive ? `Đặt lại điểm danh, ĐÃ lưu lịch sử ${archive.summary.checked} lượt` : 'Đặt lại điểm danh (chưa có ai điểm danh nên không lưu)'
          );
          return { archive };
        }
        const result = await Attendance.deleteMany({});
        await audit(req, 'attendance.reset', `Đặt lại điểm danh, KHÔNG lưu lịch sử, xóa ${result.deletedCount} bản ghi`);
        return { archive: null };
      });
      res.json({ message: 'Đã đặt lại dữ liệu điểm danh thành công.', archive: out.archive });
    } catch (err) {
      next(err);
    }
  },
};
