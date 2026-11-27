import { AuditLog } from '../models/index.js';

function parseDate(v) {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const auditController = {
  // Xem nhật ký (mới nhất trước), có lọc theo thao tác / người thực hiện / thời gian và phân trang.
  async list(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
      const action = req.query.action ? String(req.query.action).trim() : undefined;
      const actor = req.query.actor ? String(req.query.actor).trim() : undefined;
      const from = parseDate(req.query.from);
      const to = parseDate(req.query.to);

      const [items, total] = await Promise.all([
        AuditLog.findRecent({ action, actor, from, to, limit, page }),
        AuditLog.count({ action, actor, from, to }),
      ]);
      res.json({ items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
    } catch (err) {
      next(err);
    }
  },
};
