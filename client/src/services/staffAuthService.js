import api from './api.js';

const STORAGE_KEY_STAFF = 'z176_v2_staff_session';

export const staffAuthService = {
  /**
   * Đăng nhập tài khoản quản trị (Admin hoặc Quản lý) qua API Server
   * @param {string} code
   * @param {string} password
   * @returns {Promise<object>}
   */
  async login(code, password) {
    const data = await api.post('/auth/staff/login', { code, password });
    const session = {
      ...data.user,
      token: data.token,
      expiresAt: data.expiresAt,
    };

    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(session));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_staff_session_changed', { detail: session }));
    }
    return session;
  },

  /**
   * Lấy phiên đăng nhập quản trị hiện tại
   * @returns {Promise<object | null>}
   */
  async getStaffSession() {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.expiresAt) return null;
      if (Date.now() > parsed.expiresAt) {
        this.logout();
        return null;
      }
      return parsed;
    } catch {
      this.logout();
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
