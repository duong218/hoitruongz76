import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * 1. Đăng nhập Quản trị (Admin / Manager):
 * Chống brute-force dò mật khẩu vào tài khoản quản trị theo IP.
 * Chỉ đếm các lần đăng nhập THẤT BẠI (skipSuccessfulRequests: true).
 */
export const staffLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã nhập sai thông tin quản trị quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
});

/**
 * 2. Tra cứu mã nhân viên (Attendee Lookup):
 * Định danh theo MÃ NHÂN VIÊN (keyGenerator: req.body.code) thay vì theo IP.
 * Điều này đảm bảo: Dù 200 nhân viên cùng kết nối chung một mạng Wifi công ty (chung IP NAT/Gateway),
 * việc một người nhập sai nhiều lần chỉ khóa riêng mã nhân viên đó, KHÔNG ảnh hưởng tới các nhân viên khác!
 */
export const attendeeLookupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  limit: 10, // Một mã nhân sự nhập sai tối đa 10 lần trong 5 phút
  skipSuccessfulRequests: true, // Nhập đúng được thông qua ngay, không tính vào giới hạn
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Khóa theo mã nhân viên được gửi lên, chuẩn hóa viết hoa và bỏ khoảng trắng
    const code = (req.body?.code || '').toString().trim().toUpperCase();
    // Nếu không gửi code thì mới dùng IP fallback
    return code || ipKeyGenerator(req.ip || '');
  },
  message: { message: 'Mã nhân viên này đã bị thử sai quá nhiều lần. Vui lòng thử lại sau 5 phút.' },
});
