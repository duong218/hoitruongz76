import { Attendance, Seat, EventSetting, Employee, Group } from '../models/index.js';
import { ROLES } from '../constants/roles.server.js';

export const attendanceController = {
  // Lấy danh sách điểm danh
  async getAll(req, res, next) {
    try {
      const list = await Attendance.find().sort({ checkedInAt: -1 });
      res.json(list);
    } catch (err) {
      next(err);
    }
  },

  // Điểm danh
  async checkIn(req, res, next) {
    try {
      const { employeeCode, seatId, token } = req.body;
      const code = (employeeCode || '').trim().toUpperCase();

      if (!code || !seatId) {
        return res.status(400).json({ message: 'Thiếu thông tin điểm danh.' });
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

      // 4. Kiểm tra ghế và token
      const seat = await Seat.findOne({ seatId }).select('+token');
      if (!seat) {
        return res.status(400).json({ message: `Không tìm thấy ghế "${seatId}" trong hội trường.` });
      }

      if (token && seat.token && token.trim().toUpperCase() !== seat.token.trim().toUpperCase()) {
        return res.status(400).json({ message: 'Mã QR không khớp với ghế này. Hãy quét đúng mã dán trên ghế.' });
      }

      // 5. Kiểm tra ghế có thuộc nhóm của nhân sự không
      if (!seat.groupId || seat.groupId !== group.id) {
        return res.status(400).json({
          message: `Ghế "${seatId}" không thuộc khu vực của nhóm bạn (${group.name}). Hãy tới đúng hàng được phân bổ.`,
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

      const newRecord = await Attendance.create({
        employeeCode: code,
        seatId,
        checkedInAt: new Date(),
      });

      res.status(201).json(newRecord);
    } catch (err) {
      next(err);
    }
  },

  // Đặt lại dữ liệu điểm danh
  async reset(req, res, next) {
    try {
      await Attendance.deleteMany({});
      res.json({ message: 'Đã đặt lại dữ liệu điểm danh thành công.' });
    } catch (err) {
      next(err);
    }
  },
};

