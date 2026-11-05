import { ROLES } from '../constants/roles.js';

/**
 * Hàm thuần xác thực đăng nhập quản trị (Admin / Quản lý)
 * Nơi duy nhất kiểm tra mật khẩu tài khoản quản trị trong toàn ứng dụng.
 * @param {Array<object>} employees - Danh sách nhân sự
 * @param {string} code - Mã tài khoản nhập vào
 * @param {string} password - Mật khẩu nhập vào
 * @returns {{ ok: boolean, user?: object, error?: string }}
 */
export function verifyStaffLogin(employees, code, password) {
  const trimmedCode = (code || '').trim().toUpperCase();
  const trimmedPassword = (password || '').trim();

  // Kiểm tra mã hoặc mật khẩu trống
  if (!trimmedCode || !trimmedPassword) {
    return {
      ok: false,
      error: 'Mã hoặc mật khẩu không đúng.',
    };
  }

  const staff = (employees || []).find((e) => e.code?.toUpperCase() === trimmedCode);

  // Chỉ nhận vai trò Quản trị hoặc Quản lý.
  // Mã hay mật khẩu sai, hoặc mã của nhân viên thường:
  // Luôn trả cùng 1 câu lỗi "Mã hoặc mật khẩu không đúng." (không tiết lộ mã có tồn tại hay không).
  if (!staff || (staff.role !== ROLES.ADMIN && staff.role !== ROLES.MANAGER)) {
    return {
      ok: false,
      error: 'Mã hoặc mật khẩu không đúng.',
    };
  }

  // So sánh mật khẩu (mật khẩu thô trong mockData khi DEMO_MODE)
  if (!staff.password || staff.password !== trimmedPassword) {
    return {
      ok: false,
      error: 'Mã hoặc mật khẩu không đúng.',
    };
  }

  // Hợp lệ -> Trả về thông tin quản trị viên (không trả trường password ra ngoài phiên)
  return {
    ok: true,
    user: {
      code: staff.code,
      name: staff.name,
      role: staff.role,
      departmentId: staff.departmentId || null,
      blockId: staff.blockId || null,
    },
  };
}
