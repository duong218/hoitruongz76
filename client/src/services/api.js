import axios from 'axios';

// Cấu hình Base URL hỗ trợ biến môi trường khi chuyển sang Backend Node.js / Express
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm Token xác thực nếu có
api.interceptors.request.use(
  (config) => {
    const staffSession = localStorage.getItem('z176_v2_staff_session');
    if (staffSession) {
      try {
        const parsed = JSON.parse(staffSession);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        // bỏ qua nếu lỗi parse
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Nếu token hết hạn hoặc không hợp lệ (401), dọn dẹp session staff
    if (error.response?.status === 401) {
      const currentSession = localStorage.getItem('z176_v2_staff_session');
      if (currentSession) {
        localStorage.removeItem('z176_v2_staff_session');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('z176_staff_session_changed', { detail: null }));
        }
      }
    }
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default api;

