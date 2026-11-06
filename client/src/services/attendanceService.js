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
   * Quản lý / Quản trị viên điểm danh hộ cho người không có điện thoại hoặc camera hỏng
   * @param {{ employeeCode: string, seatId?: string, reason?: string }} param0
   * @returns {Promise<{ message: string, record: object }>}
   */
  async manualCheckInByStaff({ employeeCode, seatId, reason }) {
    const res = await api.post('/attendance/manual-checkin', { employeeCode, seatId, reason });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('z176_attendance_updated'));
    }
    return res;
  },

  /**
   * Đặt lại toàn bộ dữ liệu điểm danh
   * @returns {Promise<void>}
   */
  async resetAttendance(save = false) {
    const res = await api.post('/attendance/reset', { save });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('z176_attendance_updated'));
    }
    return res; // { archive } — archive có khi đã lưu lịch sử
  },
};
