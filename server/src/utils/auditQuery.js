// Dựng bộ lọc truy vấn nhật ký từ query string (hàm thuần, dễ kiểm tra).
// Mọi giá trị đều được kiểm tra kiểu và độ dài, không đưa thẳng input vào MongoDB.
const ACTION_RE = /^[a-z_]+(\.[a-z_]+)?$/;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_PAGE = 10000;

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asDate(value) {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {object} query - req.query: action, actor, from, to, page, limit
 * @returns {{ filter: object, limit: number, page: number, skip: number }}
 */
export function buildAuditQuery(query = {}) {
  const filter = {};

  // "employee" = mọi hành động employee.*, "employee.delete" = đúng 1 hành động
  const action = asString(query.action);
  if (action && ACTION_RE.test(action)) {
    filter.action = action.includes('.') ? action : { $regex: `^${action}\\.` };
  }

  // Tìm theo mã người thực hiện, khớp phần đầu, không phân biệt hoa thường
  const actor = asString(query.actor).slice(0, 30);
  if (actor) {
    filter.actorCode = { $regex: `^${escapeRegex(actor)}`, $options: 'i' };
  }

  const from = asDate(query.from);
  const to = asDate(query.to);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), MAX_PAGE);

  return { filter, limit, page, skip: (page - 1) * limit };
}
