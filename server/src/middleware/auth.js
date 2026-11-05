import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Không có khóa bí mật đủ mạnh thì không cho server chạy
if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET trong file .env phải có ít nhất 32 ký tự. Tạo bằng: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Chỉ nhận token qua header "Authorization: Bearer ...".
// Không dùng cookie nữa: cookie không bị xóa khi đăng xuất và mở đường cho tấn công CSRF.
function readToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

function verify(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

export function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
  }
  try {
    req.user = verify(token); // { code, name, role, ... }
    next();
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

// Không bắt buộc đăng nhập (dành cho khách mời):
// không có token thì cho qua, có token nhưng sai hoặc hết hạn thì báo 401 để client đăng nhập lại.
export function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = verify(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' });
    }
    next();
  };
}
