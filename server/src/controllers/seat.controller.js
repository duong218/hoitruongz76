import { Seat, Group, Employee } from '../models/index.js';
import { rowSeatIds, SEAT_ID_REGEX } from '../constants/hall.server.js';
import { audit } from '../utils/audit.js';

const personalList = async () =>
  (await Seat.findAll()).filter((s) => s.employeeCode).map((s) => ({ seatId: s.seatId, employeeCode: s.employeeCode }));

export const seatController = {
  // Ghế của CHÍNH người đang đăng nhập (chế độ từng người). Không lộ ghế của người khác.
  async getMine(req, res, next) {
    try {
      const s = await Seat.findByEmployeeCode(req.user.code);
      res.json({ seatId: s?.seatId || null });
    } catch (err) {
      next(err);
    }
  },

  // Danh sách ghế đã sắp theo từng người (quản lý)
  async getPersonal(req, res, next) {
    try {
      res.json(await personalList());
    } catch (err) {
      next(err);
    }
  },

  // Gán 1 người vào 1 ghế (seatId = null: bỏ gán). Mỗi người 1 ghế, mỗi ghế 1 người.
  async assignEmployee(req, res, next) {
    try {
      const code = String(req.body.employeeCode || '').trim().toUpperCase();
      const seatId = req.body.seatId ? String(req.body.seatId).trim() : null;
      if (!(await Employee.findByCode(code))) return res.status(404).json({ message: `Không có nhân sự mã "${code}".` });
      if (seatId) {
        if (!SEAT_ID_REGEX.test(seatId)) return res.status(400).json({ message: 'Mã ghế không hợp lệ.' });
        const existingSeat = await Seat.findBySeatId(seatId);
        if (existingSeat && existingSeat.employeeCode && existingSeat.employeeCode !== code) {
          return res.status(409).json({ message: `Ghế ${seatId} đã dành cho ${existingSeat.employeeCode}. Hãy bỏ gán người đó trước.` });
        }
      }
      await Seat.clearEmployeeCode(code);
      if (seatId) await Seat.upsert(seatId, { employeeCode: code });
      await audit(req, 'seats.assign_employee', seatId ? `Gán [${code}] vào ghế ${seatId}` : `Bỏ ghế riêng của [${code}]`);
      res.json(await personalList());
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách gán ghế dạng Map: { "1-L-1": "group-id", ... }
  async getAssignments(req, res, next) {
    try {
      const seats = await Seat.findAll();
      const map = {};
      seats.forEach((s) => {
        if (s.groupId) {
          map[s.seatId] = s.groupId;
        }
      });
      res.json(map);
    } catch (err) {
      next(err);
    }
  },

  // Gán ghế theo mảng seatIds
  async assignSeats(req, res, next) {
    try {
      const { seatIds = [], groupId = null } = req.body;
      if (!Array.isArray(seatIds)) {
        return res.status(400).json({ message: 'Danh sách ghế không hợp lệ.' });
      }

      await Seat.updateManyGroup(seatIds, groupId || null);

      let targetGroupName = 'trống';
      if (groupId) {
        const grp = await Group.findById(groupId);
        targetGroupName = grp ? `nhóm "${grp.name}"` : 'nhóm';
      }
      await audit(req, 'seats.assign', `Gán ${targetGroupName} cho ${seatIds.length} ghế`);

      const all = await Seat.findAll();
      const map = {};
      all.forEach((s) => {
        if (s.groupId) map[s.seatId] = s.groupId;
      });
      res.json(map);
    } catch (err) {
      next(err);
    }
  },

  // Gán ghế theo danh sách hàng
  async assignRows(req, res, next) {
    try {
      const { rowNumbers = [], groupId = null } = req.body;
      const allSeats = [];
      rowNumbers.forEach((r) => allSeats.push(...rowSeatIds(r)));

      await Seat.updateManyGroup(allSeats, groupId || null);

      let targetGroupName = 'trống';
      if (groupId) {
        const grp = await Group.findById(groupId);
        targetGroupName = grp ? `nhóm "${grp.name}"` : 'nhóm';
      }
      await audit(req, 'seats.assign_rows', `Gán ${targetGroupName} cho hàng ${rowNumbers.join(', ')}`);

      const all = await Seat.findAll();
      const map = {};
      all.forEach((s) => {
        if (s.groupId) map[s.seatId] = s.groupId;
      });
      res.json(map);
    } catch (err) {
      next(err);
    }
  },
};

