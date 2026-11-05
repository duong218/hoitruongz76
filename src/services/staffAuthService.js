// MERN: bcrypt so khớp mật khẩu, cấp JWT trong cookie httpOnly, giới hạn số lần đăng nhập sai (rate limit). Mật khẩu thô chỉ tồn tại trong mockData khi DEMO_MODE.
import { verifyStaffLogin } from '../utils/staffAuth.js';
import { employeeService } from './employeeService.js';

const STORAGE_KEY_STAFF = 'z176_v2_staff_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 giờ

export const staffAuthService = {
  /**
   * Đăng nhập tài khoản quản trị (Admin hoặc Quản lý)
   * @param {string} code
   * @param {string} password
   * @returns {Promise<object>}
   */
  async login(code, password) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const employees = await employeeService.getEmployees();
    const result = verifyStaffLogin(employees, code, password);

    if (!result.ok) {
      throw new Error(result.error || 'Mã hoặc mật khẩu không đúng.');
    }

    const session = {
      ...result.user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(session));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_staff_session_changed', { detail: session }));
    }
    return session;
  },

  /**
   * Lấy phiên đăng nhập quản trị hiện tại (tự động xóa nếu đã quá 8 giờ)
   * @returns {Promise<object | null>}
   */
  async getStaffSession() {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.expiresAt) return null;
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY_STAFF);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('z176_staff_session_changed', { detail: null }));
        }
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY_STAFF);
      return null;
    }
  },

  /**
   * Đăng xuất phiên quản trị
   * @returns {Promise<void>}
   */
  async logout() {
    localStorage.removeItem(STORAGE_KEY_STAFF);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_staff_session_changed', { detail: null }));
    }
  },
};
