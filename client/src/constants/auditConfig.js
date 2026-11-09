import { Users, Layers, Armchair, Calendar, UserCheck, ShieldAlert, ScrollText } from 'lucide-react';

// Lọc theo nhóm thao tác (gửi lên server dạng ?action=employee)
export const AUDIT_CATEGORIES = [
  { value: '', label: 'Tất cả thao tác' },
  { value: 'employee', label: 'Nhân viên' },
  { value: 'group', label: 'Nhóm ghế' },
  { value: 'seats', label: 'Sắp chỗ' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'attendance', label: 'Điểm danh' },
  { value: 'auth', label: 'Bảo mật' },
];

export const AUDIT_TIME_RANGES = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Tất cả' },
];

// Icon theo nhóm thao tác
export const AUDIT_CATEGORY_ICONS = {
  employee: Users,
  group: Layers,
  seats: Armchair,
  event: Calendar,
  attendance: UserCheck,
  auth: ShieldAlert,
};

// Tên hiển thị và mức độ của từng hành động server đang ghi.
// tone khớp với variant của Badge: success | info | warning | error | neutral
export const AUDIT_ACTIONS = {
  'employee.create': { label: 'Thêm nhân sự', tone: 'success' },
  'employee.update': { label: 'Sửa nhân sự', tone: 'info' },
  'employee.delete': { label: 'Xóa nhân sự', tone: 'error' },
  'employee.import': { label: 'Nhập Excel', tone: 'info' },
  'group.create': { label: 'Tạo nhóm ghế', tone: 'success' },
  'group.update': { label: 'Sửa nhóm ghế', tone: 'info' },
  'group.delete': { label: 'Xóa nhóm ghế', tone: 'error' },
  'seats.assign': { label: 'Gán ghế', tone: 'info' },
  'seats.assign_rows': { label: 'Gán hàng ghế', tone: 'info' },
  'event.update': { label: 'Cập nhật sự kiện', tone: 'info' },
  'event.start_new': { label: 'Bắt đầu sự kiện mới', tone: 'warning' },
  'attendance.reset': { label: 'Đặt lại điểm danh', tone: 'error' },
  'event.auto_archive': { label: 'Tự lưu lịch sử khi hết giờ', tone: 'info' },
  'history.view': { label: 'Xem lịch sử sự kiện', tone: 'info' },
  'history.export': { label: 'Xuất Excel lịch sử', tone: 'info' },
  'attendance.manual_checkin': { label: 'Điểm danh hộ', tone: 'warning' },
  'auth.login_failed': { label: 'Đăng nhập sai', tone: 'warning' },
};

// Hành động mới server thêm sau này mà chưa khai báo ở trên vẫn hiện được (theo tên gốc)
export function getAuditAction(action) {
  return AUDIT_ACTIONS[action] || { label: action || 'Không rõ', tone: 'neutral' };
}

export function getAuditCategoryIcon(action) {
  const category = String(action || '').split('.')[0];
  return AUDIT_CATEGORY_ICONS[category] || ScrollText;
}

// Lưới cột dùng chung cho dòng tiêu đề và từng dòng nhật ký (từ màn hình md trở lên)
export const AUDIT_GRID_COLS = 'md:grid-cols-[96px_minmax(0,230px)_190px_minmax(0,1fr)]';
