import rateLimit from 'express-rate-limit';

// Chỉ đếm các lần SAI (skipSuccessfulRequests), người dùng đúng không bị ảnh hưởng.
function limiter(windowMinutes, limit, message) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

export const staffLoginLimiter = limiter(15, 10, 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
export const attendeeLookupLimiter = limiter(5, 20, 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau vài phút.');
