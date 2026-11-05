import api from './api.js';

export const attendanceService = {
  /**
   * Lấy danh sách điểm danh từ server
   * @returns {Promise<Array<{ employeeCode: string, seatId: string, checkedInAt: string }>>}
   */
  async getAttendance() {
    return await api.get('/attendance');
  },

  /**
   * Ghi nhận điểm danh qua API
   * Mã nhân viên do server lấy từ phiên đăng nhập, không gửi từ client.
   * @param {{ seatId: string, token: string }} param0
   * @returns {Promise<{ employeeCode: string, seatId: string, checkedInAt: string }>}
   */
  async checkIn({ seatId, token }) {
    const record = await api.post('/attendance/checkin', { seatId, token });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('z176_attendance_updated'));
    }
    return record;
  },

  /**
   * Đặt lại toàn bộ dữ liệu điểm danh
   * @returns {Promise<void>}
   */
  async resetAttendance() {
    await api.post('/attendance/reset');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('z176_attendance_updated'));
    }
  },
};
