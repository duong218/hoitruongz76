import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Employee } from '../models/index.js';

// Không có khóa bí mật đủ mạnh thì không cho server chạy
// Chuỗi mẫu từng nằm trong .env.example (repo công khai) nên không bao giờ được dùng làm khóa thật
const PLACEHOLDER_SECRETS = ['doi-thanh-chuoi-bi-mat-dai-ngau-nhien'];
if (PLACEHOLDER_SECRETS.includes(env.JWT_SECRET)) {
  console.error('JWT_SECRET đang là chuỗi mẫu công khai trong .env.example. Hãy tạo chuỗi ngẫu nhiên riêng rồi khởi động lại.');
  process.exit(1);
}
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

// Token chỉ còn giá trị khi tài khoản còn tồn tại, vai trò không đổi
// và mật khẩu không bị đổi sau thời điểm cấp token (iat tính bằng giây).
async function isSessionLive(payload) {
  const emp = await Employee.findOne({ code: payload.code }).select('role passwordChangedAt').lean();
  if (!emp || emp.role !== payload.role) return false;
  if (emp.passwordChangedAt && Math.floor(emp.passwordChangedAt.getTime() / 1000) > payload.iat) return false;
  return true;
}

const SESSION_REVOKED = { message: 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.' };

export async function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
  }
  let payload;
  try {
    payload = verify(token); // { code, name, role, ... }
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
  if (!(await isSessionLive(payload))) return res.status(401).json(SESSION_REVOKED);
  req.user = payload;
  next();
}

// Không bắt buộc đăng nhập (dành cho khách mời):
// không có token thì cho qua, có token nhưng sai hoặc hết hạn thì báo 401 để client đăng nhập lại.
export async function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  let payload;
  try {
    payload = verify(token);
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
  if (!(await isSessionLive(payload))) return res.status(401).json(SESSION_REVOKED);
  req.user = payload;
  next();
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
