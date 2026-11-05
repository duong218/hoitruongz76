// Hàm thuần định dạng và dựng tham số cho trang Nhật ký (không phụ thuộc React).
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const pad = (n) => String(n).padStart(2, '0');

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const d = toDate(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
}

export function formatTime(value) {
  const d = toDate(value);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : '';
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? `${formatDate(d)} ${formatTime(d)}` : '';
}

export function dayKey(value) {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : 'unknown';
}

/** "Hôm nay, 05/11/2026" | "Hôm qua, 04/11/2026" | "Thứ ba, 03/11/2026" */
export function dayLabel(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return 'Không rõ ngày';
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startNow - startDay) / 86400000);
  const date = formatDate(d);
  if (diff === 0) return `Hôm nay, ${date}`;
  if (diff === 1) return `Hôm qua, ${date}`;
  return `${WEEKDAYS[d.getDay()]}, ${date}`;
}

/** Mốc bắt đầu (ISO) của khoảng thời gian; "all" thì không giới hạn. */
export function rangeToFrom(range, now = new Date()) {
  const back = { today: 0, '7d': 6, '30d': 29 }[range];
  if (back === undefined) return undefined;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - back).toISOString();
}

/** Bộ lọc trên giao diện -> tham số gọi API (bỏ các mục để trống). */
export function buildAuditParams({ range, category, actor, page = 1, limit = 50 }, now = new Date()) {
  const params = { page, limit };
  const from = rangeToFrom(range, now);
  if (from) params.from = from;
  if (category) params.action = category;
  const trimmedActor = (actor || '').trim();
  if (trimmedActor) params.actor = trimmedActor;
  return params;
}

/** Gom danh sách (đã sắp mới nhất trước) thành các nhóm theo ngày, giữ nguyên thứ tự. */
export function groupByDay(items = [], now = new Date()) {
  const groups = [];
  const index = new Map();
  for (const item of items) {
    const key = dayKey(item.createdAt);
    let group = index.get(key);
    if (!group) {
      group = { key, label: dayLabel(item.createdAt, now), items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}
