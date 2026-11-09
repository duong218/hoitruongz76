import mongoose from 'mongoose';
import { EventArchive } from '../models/index.js';
import { audit } from '../utils/audit.js';
import { archiveIfEnded } from '../utils/archive.js';

const found = async (req, res, projection) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Không tìm thấy sự kiện này trong lịch sử.' });
    return null;
  }
  const a = await EventArchive.findById(req.params.id, projection);
  if (!a) res.status(404).json({ message: 'Không tìm thấy sự kiện này trong lịch sử.' });
  return a;
};

export const historyController = {
  // Danh sách (không kèm rows cho nhẹ)
  async list(req, res, next) {
    try {
      await archiveIfEnded(); // phòng khi bộ đếm giờ chưa kịp chạy
      res.json(await EventArchive.find({}, '-rows').sort({ archivedAt: -1 }).limit(200));
    } catch (err) {
      next(err);
    }
  },

  async detail(req, res, next) {
    try {
      const a = await found(req, res);
      if (!a) return;
      await audit(req, 'history.view', `Xem lịch sử sự kiện "${a.eventName}"`);
      res.json(a);
    } catch (err) {
      next(err);
    }
  },

  // Client gọi khi đã tải Excel xong, để có dấu vết ai xuất file cũ
  async logExport(req, res, next) {
    try {
      const a = await found(req, res, 'eventName');
      if (!a) return;
      await audit(req, 'history.export', `Xuất Excel lịch sử sự kiện "${a.eventName}"`);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
