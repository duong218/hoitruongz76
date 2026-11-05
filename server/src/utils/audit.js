import { AuditLog } from '../models/index.js';

// Ghi nhật ký thao tác. Ghi lỗi cũng không được làm hỏng thao tác chính.
export async function audit(req, action, detail = '') {
  try {
    await AuditLog.create({
      action,
      actorCode: req.user?.code || null,
      actorRole: req.user?.role || null,
      detail: String(detail).slice(0, 300),
    });
  } catch (err) {
    console.error('Không ghi được nhật ký thao tác:', err.message);
  }
}

const FAILED_LOGIN_MAX_PER_MINUTE = 5;

// Đăng nhập quản trị thất bại: ghi tối đa vài dòng mỗi phút để bị dò mật khẩu cũng không làm bảng phình
export async function auditFailedLogin(attemptedCode) {
  try {
    const since = new Date(Date.now() - 60 * 1000);
    const recent = await AuditLog.countDocuments({ action: 'auth.login_failed', createdAt: { $gte: since } });
    if (recent >= FAILED_LOGIN_MAX_PER_MINUTE) return;
    await AuditLog.create({
      action: 'auth.login_failed',
      actorCode: String(attemptedCode || '').slice(0, 30) || null,
      actorRole: null,
      detail: 'Đăng nhập quản trị thất bại',
    });
  } catch (err) {
    console.error('Không ghi được nhật ký thao tác:', err.message);
  }
}
