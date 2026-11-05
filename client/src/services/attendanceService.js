// MERN: server lấy employeeCode từ token đăng nhập, không tin employeeCode do client gửi.
// MERN: thay bằng axios gọi /api/attendance
import { INITIAL_ATTENDANCE } from '../data/mockData.js';

const STORAGE_KEY_ATTENDANCE = 'z176_v2_attendance';

function getStoredAttendance() {
  const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    return [...INITIAL_ATTENDANCE];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_ATTENDANCE];
  }
}

function saveAttendance(list) {
  localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(list));
  // Phát event trong cùng window để các hook cùng tab cập nhật ngay lập tức
  window.dispatchEvent(new Event('z176_attendance_updated'));
}

export const attendanceService = {
  /**
   * Lấy danh sách điểm danh
   * @returns {Promise<Array<{ employeeCode: string, seatId: string, checkedInAt: string }>>}
   */
  async getAttendance() {
    await new Promise((r) => setTimeout(r, 40));
    return getStoredAttendance();
  },

  /**
   * Ghi nhận điểm danh
   * @param {{ employeeCode: string, seatId: string }} param0
   * @returns {Promise<{ employeeCode: string, seatId: string, checkedInAt: string }>}
   */
  async checkIn({ employeeCode, seatId }) {
    await new Promise((r) => setTimeout(r, 80));
    const list = getStoredAttendance();
    const now = new Date().toISOString();

    const newRecord = {
      employeeCode: employeeCode.trim().toUpperCase(),
      seatId,
      checkedInAt: now,
    };

    saveAttendance([...list, newRecord]);
    return newRecord;
  },

  /**
   * Đặt lại toàn bộ dữ liệu điểm danh
   * @returns {Promise<void>}
   */
  async resetAttendance() {
    await new Promise((r) => setTimeout(r, 60));
    saveAttendance([]);
  },
};
