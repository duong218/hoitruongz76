// Chạy: node src/utils/auditQuery.check.js
import assert from 'node:assert';
import { buildAuditQuery } from './auditQuery.js';

// Mặc định
{
  const q = buildAuditQuery({});
  assert.deepStrictEqual(q.filter, {});
  assert.strictEqual(q.limit, 50);
  assert.strictEqual(q.page, 1);
  assert.strictEqual(q.skip, 0);
}

// Lọc theo nhóm thao tác và theo đúng 1 thao tác
{
  assert.deepStrictEqual(buildAuditQuery({ action: 'employee' }).filter.action, { $regex: '^employee\\.' });
  assert.strictEqual(buildAuditQuery({ action: 'employee.delete' }).filter.action, 'employee.delete');
}

// Input lạ bị bỏ qua, không lọt vào truy vấn (chống NoSQL injection)
{
  assert.strictEqual(buildAuditQuery({ action: { $ne: '' } }).filter.action, undefined);
  assert.strictEqual(buildAuditQuery({ action: 'a.b.c' }).filter.action, undefined);
  assert.strictEqual(buildAuditQuery({ action: ['employee', 'group'] }).filter.action, undefined);
  assert.strictEqual(buildAuditQuery({ actor: { $gt: '' } }).filter.actorCode, undefined);
}

// Tìm người thực hiện: thoát ký tự đặc biệt của regex, cắt độ dài
{
  const { filter } = buildAuditQuery({ actor: ' AD.*MIN ' });
  assert.strictEqual(filter.actorCode.$regex, '^AD\\.\\*MIN');
  assert.strictEqual(filter.actorCode.$options, 'i');
  assert.ok(buildAuditQuery({ actor: 'x'.repeat(100) }).filter.actorCode.$regex.length <= 31);
}

// Khoảng thời gian: ngày sai thì bỏ qua
{
  const ok = buildAuditQuery({ from: '2026-11-01T00:00:00.000Z', to: '2026-11-05T23:59:59.999Z' }).filter.createdAt;
  assert.ok(ok.$gte instanceof Date && ok.$lte instanceof Date);
  assert.strictEqual(buildAuditQuery({ from: 'không-phải-ngày' }).filter.createdAt, undefined);
}

// Phân trang: kẹp giới hạn, tính skip
{
  assert.strictEqual(buildAuditQuery({ limit: '9999' }).limit, 100);
  assert.strictEqual(buildAuditQuery({ limit: '-5' }).limit, 1);
  assert.strictEqual(buildAuditQuery({ limit: 'abc' }).limit, 50);
  const q = buildAuditQuery({ page: '3', limit: '20' });
  assert.strictEqual(q.skip, 40);
  assert.strictEqual(buildAuditQuery({ page: '0' }).page, 1);
  assert.strictEqual(buildAuditQuery({ page: '99999999' }).page, 10000);
}

console.log('✓ auditQuery: tất cả kiểm tra đạt');
