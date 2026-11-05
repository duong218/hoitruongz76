import { AuditLog } from '../models/index.js';

export const auditController = {
  // Xem nhật ký mới nhất (mặc định 100 dòng, tối đa 500)
  async list(req, res, next) {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },
};
