import api from './api.js';

const STORAGE_KEY_ATTENDEE = 'z176_v2_attendee_session';

export const ATTENDEE_LOGIN_CODES = {
  OK: 'OK',
  ROLE_NEEDS_PASSWORD: 'ROLE_NEEDS_PASSWORD',
  NOT_FOUND: 'NOT_FOUND',
  EMPTY: 'EMPTY',
};

export const attendeeService = {
  /**
   * Tra cứu mã nhân viên và xác thực phiên người tham dự qua API
   * @param {string} code
   * @returns {Promise<{ ok: boolean, code: string, message?: string, user?: object, group?: object | null }>}
   */
  async lookupByCode(code) {
    const trimmedCode = (code || '').trim().toUpperCase();
    if (!trimmedCode) {
      return {
        ok: false,
        code: ATTENDEE_LOGIN_CODES.EMPTY,
        message: 'Vui lòng nhập mã nhân viên.',
      };
    }

    try {
      const res = await api.post('/auth/attendee/lookup', { code: trimmedCode });
      if (res.ok && res.user) {
        localStorage.setItem(STORAGE_KEY_ATTENDEE, JSON.stringify(res.user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('z176_attendee_session_changed', { detail: res.user }));
        }
        return {
          ok: true,
          code: ATTENDEE_LOGIN_CODES.OK,
          user: res.user,
          group: res.group,
        };
      }
      return { ok: false, code: ATTENDEE_LOGIN_CODES.NOT_FOUND, message: 'Lỗi xác thực người dùng.' };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('dành cho tài khoản quản trị') || err.code === 'ROLE_NEEDS_PASSWORD') {
        return {
          ok: false,
          code: ATTENDEE_LOGIN_CODES.ROLE_NEEDS_PASSWORD,
          message: 'Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.',
        };
      }
      return {
        ok: false,
        code: ATTENDEE_LOGIN_CODES.NOT_FOUND,
        message: msg || 'Không tìm thấy mã nhân viên này. Vui lòng kiểm tra lại.',
      };
    }
  },

  /**
   * Đăng nhập người tham dự với tư cách khách mời qua API
   * @param {string} fullName
   * @returns {Promise<{ ok: boolean, user: object, group: object }>}
   */
  async enterAsGuest(fullName) {
    const trimmed = (fullName || '').trim();
    if (!trimmed) {
      throw new Error('Vui lòng nhập họ và tên của quý khách.');
    }

    const res = await api.post('/auth/attendee/guest', { fullName: trimmed });
    if (res.ok && res.user) {
      localStorage.setItem(STORAGE_KEY_ATTENDEE, JSON.stringify(res.user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('z176_attendee_session_changed', { detail: res.user }));
      }
      return {
        ok: true,
        user: res.user,
        group: res.group,
      };
    }
    throw new Error('Không thể đăng nhập khách mời.');
  },

  /**
   * Lấy phiên người tham dự hiện tại
   * @returns {Promise<object | null>}
   */
  async getAttendeeSession() {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDEE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Đăng xuất phiên người tham dự
   * @returns {Promise<void>}
   */
  async logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ATTENDEE);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_attendee_session_changed', { detail: null }));
    }
  },
};
