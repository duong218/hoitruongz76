import { getPool } from '../config/db.js';

/**
 * Tự động xóa nhật ký (AuditLogs) và lịch sử sự kiện (EventArchives) quá 2 năm
 * để giữ cơ sở dữ liệu gọn nhẹ khi vận hành lâu dài.
 */
export async function cleanupOldRecords() {
  try {
    const pool = getPool();
    await pool.request().query(`
      DELETE FROM AuditLogs WHERE createdAt < DATEADD(year, -2, SYSUTCDATETIME());
      DELETE FROM EventArchives WHERE archivedAt < DATEADD(year, -2, SYSUTCDATETIME());
    `);
  } catch (err) {
    console.error('[Cleanup] Lỗi khi dọn dữ liệu quá 2 năm:', err.message);
  }
}

export function startCleanupScheduler() {
  cleanupOldRecords();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timer = setInterval(cleanupOldRecords, ONE_DAY_MS);
  if (timer.unref) timer.unref();
}
