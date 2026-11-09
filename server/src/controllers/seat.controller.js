import { Seat, Group } from '../models/index.js';
import { rowSeatIds } from '../constants/hall.server.js';
import { audit } from '../utils/audit.js';

export const seatController = {
  // Lấy danh sách gán ghế dạng Map: { "1-L-1": "group-id", ... }
  async getAssignments(req, res, next) {
    try {
      const seats = await Seat.find();
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

      await Seat.updateMany(
        { seatId: { $in: seatIds } },
        { $set: { groupId: groupId || null } }
      );

      let targetGroupName = 'trống';
      if (groupId) {
        const grp = await Group.findOne({ id: groupId });
        targetGroupName = grp ? `nhóm "${grp.name}"` : 'nhóm';
      }
      await audit(req, 'seats.assign', `Gán ${targetGroupName} cho ${seatIds.length} ghế`);

      const all = await Seat.find();
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

      await Seat.updateMany(
        { seatId: { $in: allSeats } },
        { $set: { groupId: groupId || null } }
      );

      let targetGroupName = 'trống';
      if (groupId) {
        const grp = await Group.findOne({ id: groupId });
        targetGroupName = grp ? `nhóm "${grp.name}"` : 'nhóm';
      }
      await audit(req, 'seats.assign_rows', `Gán ${targetGroupName} cho hàng ${rowNumbers.join(', ')}`);

      const all = await Seat.find();
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

