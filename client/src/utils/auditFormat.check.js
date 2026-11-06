// Chạy: node src/utils/auditFormat.check.js
import assert from 'node:assert';
import { formatDateTime, dayLabel, rangeToFrom, buildAuditParams, groupByDay } from './auditFormat.js';

const now = new Date(2026, 10, 5, 9, 30, 0); // 05/11/2026 (Thứ năm), giờ máy

assert.strictEqual(formatDateTime(new Date(2026, 10, 5, 8, 5, 3)), '05/11/2026 08:05:03');
assert.strictEqual(formatDateTime('không phải ngày'), '');

// Nhãn ngày
assert.strictEqual(dayLabel(new Date(2026, 10, 5, 0, 1), now), 'Hôm nay, 05/11/2026');
assert.strictEqual(dayLabel(new Date(2026, 10, 4, 23, 59), now), 'Hôm qua, 04/11/2026');
assert.strictEqual(dayLabel(new Date(2026, 10, 3, 12), now), 'Thứ ba, 03/11/2026');
assert.strictEqual(dayLabel('hỏng', now), 'Không rõ ngày');

// Khoảng thời gian: hôm nay = từ 0h hôm nay; 7 ngày gồm cả hôm nay; tất cả = không giới hạn
const fromToday = new Date(rangeToFrom('today', now));
assert.deepStrictEqual([fromToday.getDate(), fromToday.getHours()], [5, 0]);
assert.strictEqual(new Date(rangeToFrom("7d", now)).getDate(), 30); // 05/11 lùi 6 ngày = 30/10
assert.strictEqual(new Date(rangeToFrom('7d', now)).getMonth(), 9);
assert.strictEqual(rangeToFrom('all', now), undefined);

// Tham số API: bỏ mục trống
assert.deepStrictEqual(buildAuditParams({ range: 'all', category: '', actor: '  ', page: 2, limit: 50 }, now), { page: 2, limit: 50 });
const p = buildAuditParams({ range: 'today', category: 'employee', actor: ' ADMIN01 ' }, now);
assert.strictEqual(p.action, 'employee');
assert.strictEqual(p.actor, 'ADMIN01');
assert.ok(typeof p.from === 'string');

// Chọn ngày: ưu tiên hơn khoảng thời gian, tính trọn ngày, chọn ngược thì đảo
{
  const one = buildAuditParams({ range: '7d', fromDate: '2026-11-03', toDate: '2026-11-03' }, now);
  assert.strictEqual(new Date(one.from).getTime(), new Date(2026, 10, 3).getTime());
  assert.strictEqual(new Date(one.to).getTime(), new Date(2026, 10, 3, 23, 59, 59, 999).getTime());
  const fromOnly = buildAuditParams({ range: 'all', fromDate: '2026-11-01' }, now);
  assert.ok(fromOnly.from && !fromOnly.to);
  const toOnly = buildAuditParams({ range: 'today', toDate: '2026-11-01' }, now);
  assert.ok(toOnly.to && !toOnly.from); // không rơi về mốc "Hôm nay"
  const swapped = buildAuditParams({ range: 'all', fromDate: '2026-11-05', toDate: '2026-11-01' }, now);
  assert.ok(new Date(swapped.from) < new Date(swapped.to));
  assert.deepStrictEqual(buildAuditParams({ range: 'all', fromDate: 'hỏng', toDate: '' }, now), { page: 1, limit: 50 });
}

// Gom theo ngày, giữ thứ tự mới nhất trước
const groups = groupByDay(
  [
    { id: 'a', createdAt: new Date(2026, 10, 5, 9, 0).toISOString() },
    { id: 'b', createdAt: new Date(2026, 10, 5, 8, 0).toISOString() },
    { id: 'c', createdAt: new Date(2026, 10, 4, 17, 0).toISOString() },
  ],
  now
);
assert.strictEqual(groups.length, 2);
assert.deepStrictEqual(groups[0].items.map((x) => x.id), ['a', 'b']);
assert.strictEqual(groups[0].label, 'Hôm nay, 05/11/2026');
assert.strictEqual(groups[1].label, 'Hôm qua, 04/11/2026');
assert.deepStrictEqual(groupByDay([], now), []);

console.log('✓ auditFormat: tất cả kiểm tra đạt');