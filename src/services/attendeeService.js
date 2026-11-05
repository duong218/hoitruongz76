// MERN: thay bằng axios gọi /api/attendee/lookup, /api/attendee/guest...
import { employeeService } from './employeeService.js';
import { groupService } from './groupService.js';
import { ROLES, GUEST_GROUP_ID, GUEST_GROUP_NAME } from '../constants/roles.js';
import { resolveGroup } from '../utils/resolveGroup.js';

const STORAGE_KEY_ATTENDEE = 'z176_v2_attendee_session';

export const ATTENDEE_LOGIN_CODES = {
  OK: 'OK',
  ROLE_NEEDS_PASSWORD: 'ROLE_NEEDS_PASSWORD',
  NOT_FOUND: 'NOT_FOUND',
  EMPTY: 'EMPTY',
};

export const attendeeService = {
  /**
   * Tra cứu mã nhân viên và xác thực phiên người tham dự
   * Chỉ chấp nhận vai trò Nhân viên.
   * Nếu mã thuộc Quản trị hoặc Quản lý: từ chối với mã ROLE_NEEDS_PASSWORD.
   * @param {string} code
   * @returns {Promise<{ ok: boolean, code: string, message?: string, user?: object, group?: object | null }>}
   */
  async lookupByCode(code) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const trimmedCode = (code || '').trim().toUpperCase();
    if (!trimmedCode) {
      return {
        ok: false,
        code: ATTENDEE_LOGIN_CODES.EMPTY,
        message: 'Vui lòng nhập mã nhân viên.',
      };
    }

    const employees = await employeeService.getEmployees();
    const employee = employees.find((e) => e.code?.toUpperCase() === trimmedCode);

    if (!employee) {
      return {
        ok: false,
        code: ATTENDEE_LOGIN_CODES.NOT_FOUND,
        message: 'Không tìm thấy mã nhân viên này. Vui lòng kiểm tra lại.',
      };
    }

    // Nếu mã thuộc admin hoặc quản lý thì KHÔNG đăng nhập
    if (employee.role === ROLES.ADMIN || employee.role === ROLES.MANAGER) {
      return {
        ok: false,
        code: ATTENDEE_LOGIN_CODES.ROLE_NEEDS_PASSWORD,
        message: 'Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.',
      };
    }

    // Vai trò nhân viên thường hợp lệ
    const groups = await groupService.getGroups();
    const group = resolveGroup(employee, groups);

    const authUser = {
      code: employee.code,
      name: employee.name,
      role: employee.role,
      departmentId: employee.departmentId || null,
      blockId: employee.blockId || null,
      groupId: group ? group.id : null,
      groupName: group ? group.name : 'Chưa phân nhóm',
      isGuest: false,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ATTENDEE, JSON.stringify(authUser));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_attendee_session_changed', { detail: authUser }));
    }
    return {
      ok: true,
      code: ATTENDEE_LOGIN_CODES.OK,
      user: authUser,
      group,
    };
  },

  /**
   * Đăng nhập người tham dự với tư cách khách mời
   * @param {string} fullName
   * @returns {Promise<{ ok: boolean, user: object, group: object }>}
   */
  async enterAsGuest(fullName) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const trimmed = (fullName || '').trim();
    if (!trimmed) {
      throw new Error('Vui lòng nhập họ và tên của quý khách.');
    }

    const groups = await groupService.getGroups();
    const guestGroup = groups.find((g) => g.id === GUEST_GROUP_ID) || {
      id: GUEST_GROUP_ID,
      name: GUEST_GROUP_NAME,
      color: '#475569',
      isSystem: true,
      checkInRequired: false,
      blockIds: [],
    };

    const authUser = {
      code: 'GUEST_' + Date.now().toString().slice(-4),
      name: trimmed,
      role: ROLES.GUEST,
      departmentId: null,
      blockId: null,
      groupId: GUEST_GROUP_ID,
      groupName: guestGroup.name,
      isGuest: true,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ATTENDEE, JSON.stringify(authUser));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_attendee_session_changed', { detail: authUser }));
    }
    return {
      ok: true,
      user: authUser,
      group: guestGroup,
    };
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
