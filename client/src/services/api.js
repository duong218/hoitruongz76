import axios from 'axios';

// Cấu hình Base URL hỗ trợ biến môi trường khi chuyển sang Backend Node.js / Express
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const STAFF_KEY = 'z176_v2_staff_session';
const ATTENDEE_KEY = 'z176_v2_attendee_session';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function readToken(key) {
  try {
    return JSON.parse(localStorage.getItem(key))?.token || null;
  } catch {
    return null;
  }
}

// Request Interceptor: đính kèm token của phiên quản trị hoặc phiên nhân viên.
// Điểm danh luôn ưu tiên token nhân viên (phòng trường hợp cùng trình duyệt có cả hai phiên).
api.interceptors.request.use(
  (config) => {
    const staffToken = readToken(STAFF_KEY);
    const attendeeToken = readToken(ATTENDEE_KEY);
    const isCheckIn = config.url?.includes('/attendance/checkin');
    const useAttendee = isCheckIn ? !!attendeeToken : !staffToken && !!attendeeToken;
    const token = useAttendee ? attendeeToken : staffToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config._sessionKey = useAttendee ? ATTENDEE_KEY : STAFF_KEY;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401: token hết hạn hoặc không hợp lệ -> xóa phiên đã dùng để người dùng đăng nhập lại.
    // Không gửi token nào mà bị 401 thì coi là phiên nhân viên cũ (chưa có token).
    if (error.response?.status === 401) {
      const key = error.config?._sessionKey || ATTENDEE_KEY;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        if (typeof window !== 'undefined') {
          const eventName = key === STAFF_KEY ? 'z176_staff_session_changed' : 'z176_attendee_session_changed';
          window.dispatchEvent(new CustomEvent(eventName, { detail: null }));
        }
      }
    }
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default api;
