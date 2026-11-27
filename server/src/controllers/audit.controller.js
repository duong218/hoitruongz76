import { AuditLog } from '../models/index.js';

export const auditController = {
  // Xem nhật ký (mới nhất trước), có lọc theo thao tác và phân trang.
  async list(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
      const action = req.query.action ? String(req.query.action).trim() : undefined;

      const [items, total] = await Promise.all([
        AuditLog.findRecent({ action, limit, page }),
        AuditLog.count({ action }),
      ]);
      res.json({ items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
    } catch (err) {
      next(err);
    }
  },
};
