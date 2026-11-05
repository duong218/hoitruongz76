// MERN: thay bằng axios gọi /api/auth/login, /api/auth/me...
// Cầu nối tương thích ngược kết hợp attendeeService và staffAuthService
import { attendeeService } from './attendeeService.js';
import { staffAuthService } from './staffAuthService.js';

export const authService = {
  loginWithCode(code) {
    return attendeeService.lookupByCode(code);
  },

  loginAsGuest(fullName) {
    return attendeeService.enterAsGuest(fullName);
  },

  loginStaff(code, password) {
    return staffAuthService.login(code, password);
  },

  async getCurrentUser() {
    const attendee = await attendeeService.getAttendeeSession();
    if (attendee) return attendee;
    return staffAuthService.getStaffSession();
  },

  async logout() {
    await Promise.all([
      attendeeService.logout(),
      staffAuthService.logout(),
    ]);
  },
};
