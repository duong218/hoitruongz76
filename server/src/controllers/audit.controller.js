import { AuditLog } from '../models/index.js';
import { buildAuditQuery } from '../utils/auditQuery.js';

export const auditController = {
  // Xem nhật ký (mới nhất trước), có lọc theo thao tác / người thực hiện / thời gian và phân trang.
  // GET /api/audit?action=employee&actor=ADMIN&from=2026-11-01T00:00:00Z&to=...&page=1&limit=50
  async list(req, res, next) {
    try {
      const { filter, limit, page, skip } = buildAuditQuery(req.query);
      const [items, total] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        AuditLog.countDocuments(filter),
      ]);
      res.json({ items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
    } catch (err) {
      next(err);
    }
  },
};
