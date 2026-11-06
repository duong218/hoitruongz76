# BÁO CÁO CẤU TRÚC CLIENT & HIỆN TRẠNG KIẾN TRÚC HỆ THỐNG HỘI TRƯỜNG Z176

Báo cáo mô tả toàn bộ cấu trúc thư mục, danh mục linh kiện (components), trang màn hình (pages), dịch vụ (services), tiện ích (utils) và hiện trạng kết nối của phân hệ Client React/Vite.

> **Tổng quan hệ thống Client**:
> - Nền tảng: **React 18 / 19** với **Vite 6.x** sử dụng JavaScript thuần (`.jsx`, `.js`).
> - Định kiểu: **Tailwind CSS v4** (`@tailwindcss/vite`), biểu tượng **Lucide React**.
> - Bộ định tuyến: **React Router DOM v7** (được bọc bảo vệ chống Open Redirect trên tham số `next`).
> - UI Component Chuẩn hóa: Thiết kế hệ thống Input, Button, Switch, Modal, Badge, BottomSheet và dropdown tùy chỉnh **Select** giải quyết triệt để lỗi tràn giao diện.
> - Tính năng mở rộng gần đây:
>   - Đổi mật khẩu cá nhân: Tích hợp `ChangePasswordModal.jsx` trực tiếp trên thanh Header của `AdminLayout.jsx`.
>   - Điểm danh trực tiếp thông minh: `DirectCheckInPage.jsx` có cơ chế tự động đếm ngược 5 giây thử lại khi chưa mở cổng điểm danh và nút "Thử lại ngay".
>   - Chống spam gửi 2 lần: Sử dụng `useRef` khóa tức thời tại bộ nhớ JavaScript.
>   - Tối ưu mạng Wi-Fi: Axios timeout 20 giây kèm bẫy lỗi tiếng Việt thân thiện khi mạng chập chờn.
>   - Modal nhóm ghế (`GroupFormModal.jsx`): Hỗ trợ chế độ tạo nhanh 1-click từ Khối có sẵn và chế độ tùy chỉnh riêng.
>   - Bảng màu (`ColorSwatchPicker.jsx` & `hall.js`): Mở rộng lên 18 màu chuẩn nhận diện cao.
>   - In tem dán ghế (`ManagerEventPage.jsx` & `printQr.css`): Hỗ trợ 3 cỡ tem in A4 (Tiêu chuẩn 24 tem, Cỡ lớn 12 tem, Cực đại 6 tem).
>   - Bảng điều khiển Quản trị (`AdminDashboardPage.jsx`): Thiết kế giao diện KPI và phân quyền vai trò nghiêm ngặt.

---

## MỤC 1: CÂY THƯ MỤC CLIENT (TREE)
*(Đã loại trừ `node_modules`, `dist`, `.git`, file khóa)*

```text
client/
├── .env.example              # Mẫu khai báo API URL kết nối backend (VITE_API_URL)
├── .gitignore                # Bỏ qua dist, node_modules, biến môi trường cá nhân
├── index.html                # Trang HTML gốc gắn root DOM
├── metadata.json             # Siêu dữ liệu mô tả cấu hình dự án
├── package.json              # Khai báo dependencies: react, react-dom, react-router-dom, lucide-react, qrcode.react, html5-qrcode, xlsx, axios
├── vite.config.js            # Cấu hình Vite bundler và proxy reverse /api sang server:5000
└── src/
    ├── App.jsx               # Khai báo tuyến đường, bọc Context Providers và phân quyền vai trò
    ├── index.css             # Import Tailwind CSS v4 và định kiểu chung
    ├── main.jsx              # Entry point render App vào DOM
    ├── components/
    │   ├── attendance/
    │   │   └── ScannerModal.jsx      # Modal quét mã QR và nhập mã ghế thủ công
    │   ├── audit/
    │   │   └── AuditFilterBar.jsx    # Thanh công cụ lọc lịch sử thao tác hệ thống
    │   ├── ChangePasswordModal.jsx   # Modal đổi mật khẩu tự phục vụ cho Admin và Quản lý
    │   ├── employees/
    │   │   ├── EmployeeFormModal.jsx # Modal thêm mới và chỉnh sửa thông tin nhân sự
    │   │   ├── EmployeeTable.jsx     # Bảng danh sách nhân sự có bộ lọc Select, tìm kiếm, phân trang
    │   │   └── ImportExcelModal.jsx  # Modal đọc, xem trước và nhập danh sách từ file Excel
    │   ├── groups/
    │   │   ├── GroupFormModal.jsx    # Modal tạo/sửa nhóm: chế độ chọn nhanh từ Khối và tùy chỉnh
    │   │   └── GroupList.jsx         # Danh sách thẻ nhóm ghế, hiển thị số nhân sự và số ghế
    │   ├── hall/
    │   │   ├── EntrancePath.jsx      # Hiệu ứng đường dẫn nét đứt từ cửa vào hàng ghế trên bản đồ
    │   │   ├── geometry.js           # Hàm tính toán tọa độ SVG sân khấu, ghế, lối đi
    │   │   ├── HallLegend.jsx        # Bảng chú thích màu sắc các nhóm ghế trên sơ đồ
    │   │   ├── HallMap.jsx           # Bản đồ SVG tương tác trực quan 200 ghế ngồi
    │   │   ├── Seat.jsx              # Thể hiện SVG từng ghế đơn lẻ (màu nhóm, VIP, trạng thái)
    │   │   └── SeatRowEditor.jsx     # Modal chỉnh sửa gán nhóm hàng loạt theo hàng ghế
    │   └── ui/
    │       ├── Badge.jsx             # Nhãn trạng thái đa màu sắc
    │       ├── BottomSheet.jsx       # Bảng trượt chân trang hỗ trợ thao tác trên điện thoại
    │       ├── Button.jsx            # Nút bấm chuẩn hóa nhiều biến thể (primary, secondary, danger)
    │       ├── ColorSwatchPicker.jsx # Bảng chọn 18 màu sắc chuẩn nhận diện cao
    │       ├── EmptyState.jsx        # Khung hiển thị khi danh sách trống dữ liệu
    │       ├── GroupBadge.jsx        # Huy hiệu hiển thị tên nhóm kèm chấm màu đại diện
    │       ├── GuideAnimation.jsx    # Hướng dẫn thao tác hoạt họa trực quan
    │       ├── Input.jsx             # Ô nhập liệu có nhãn, hiển thị lỗi và helper text
    │       ├── Logo.jsx              # Logo thương hiệu Hội trường Z176
    │       ├── Modal.jsx             # Hộp thoại popup nền mờ khóa cuộn trang
    │       ├── Select.jsx            # Hộp chọn Dropdown tùy chỉnh không tràn khung, tự cuộn đẹp mắt
    │       └── Switch.jsx            # Nút gạt bật/tắt (toggle) chuẩn accessibility
    ├── constants/
    │   ├── app.js                    # Cấu hình biến môi trường, cờ chế độ DEMO
    │   ├── hall.js                   # Cấu hình hội trường 200 ghế, hàng VIP, bảng 18 màu sắc
    │   ├── navConfig.js              # Cấu hình danh mục thanh điều hướng theo quyền (ADMIN / MANAGER)
    │   └── roles.js                  # Định nghĩa các vai trò (ADMIN, MANAGER, EMPLOYEE, GUEST)
    ├── context/
    │   ├── AuthContext.jsx           # Quản lý trạng thái phiên đăng nhập của Staff và Người tham dự
    │   ├── ConfirmContext.jsx        # Hộp thoại pop-up xác nhận hành động nguy hiểm
    │   └── ToastContext.jsx          # Thông báo toast tự tắt trên toàn ứng dụng
    ├── hooks/
    │   ├── useAttendance.js          # Hook theo dõi và thao tác điểm danh đại biểu
    │   ├── useEmployees.js           # Hook quản lý danh sách nhân sự và phân quyền
    │   ├── useEventSettings.js       # Hook cấu hình thông số sự kiện, token ghế, mở/đóng điểm danh
    │   ├── useGroups.js              # Hook quản lý danh mục nhóm hội trường và liên kết khối
    │   ├── useOrg.js                 # Hook quản lý danh mục Khối và Phòng ban
    │   └── useSeatAssignments.js     # Hook theo dõi và gán chỗ ngồi trên sơ đồ
    ├── layouts/
    │   ├── AdminLayout.jsx           # Bố cục chuẩn (có toggle thu gọn menu, nút Đổi MK)
    │   └── AttendeeLayout.jsx        # Bố cục tối ưu di động cho đại biểu tham dự
    ├── pages/
    │   ├── admin/
    │   │   ├── AdminDashboardPage.jsx# Bảng điều khiển KPI quản trị, thống kê nhân sự theo khối
    │   │   ├── AuditPage.jsx         # Xem lịch sử thao tác hệ thống không thể xóa/sửa
    │   │   ├── EmployeesPage.jsx     # Trang quản lý nhân sự, đặt lại mật khẩu cán bộ
    │   │   ├── MaintenancePage.jsx   # Trang sao lưu, phục hồi dữ liệu hệ thống
    │   │   └── OrgPage.jsx           # Trang thiết lập cơ cấu tổ chức (Khối & Phòng ban)
    │   ├── attendee/
    │   │   ├── DirectCheckInPage.jsx # Trang xử lý tự động điểm danh khi quét QR ghế
    │   │   ├── LoginPage.jsx         # Giao diện đại biểu tra cứu mã NV hoặc đăng ký khách mời
    │   │   └── SeatPage.jsx          # Màn hình đại biểu xem vị trí ghế chỉ định và quét điểm danh
    │   ├── auth/
    │   │   └── StaffLoginPage.jsx    # Trang đăng nhập bảo mật dành riêng cho Admin và Quản lý
    │   └── manager/
    │       ├── AttendancePage.jsx    # Bảng giám sát điểm danh trực tiếp, điểm danh hộ, xuất Excel
    │       ├── EventHistoryPage.jsx  # Xem dữ liệu các phiên sự kiện đã lưu trữ
    │       ├── GroupsPage.jsx        # Trang quản lý nhóm ghế, thiết lập màu sắc và quy định điểm danh
    │       ├── ManagerDashboardPage.jsx # Tổng quan tiến độ sắp chỗ và tỷ lệ điểm danh theo nhóm
    │       ├── ManagerEventPage.jsx  # Cài đặt sự kiện & in mã QR dán cửa, tem dán ghế (3 kích cỡ)
    │       └── SeatingPage.jsx       # Bản đồ trực quan xếp chỗ 200 ghế theo nhóm (có thước số ghế)
    ├── routes/
    │   └── RequireRole.jsx           # Chặn và chuyển hướng người dùng theo phân quyền vai trò
    ├── services/
    │   ├── api.js                    # Cấu hình Axios Interceptors, Timeout 20s, xử lý lỗi mạng
    │   ├── attendanceService.js      # Giao tiếp API điểm danh, điểm danh hộ
    │   ├── attendeeService.js        # Giao tiếp API phiên đăng nhập người tham dự
    │   ├── authService.js            # Điểm nối xác thực tương thích ngược
    │   ├── employeeService.js        # Giao tiếp API CRUD nhân sự, import Excel
    │   ├── eventService.js           # Giao tiếp API cấu hình sự kiện và mã token ghế
    │   ├── groupService.js           # Giao tiếp API quản lý nhóm ghế hội trường
    │   ├── orgService.js             # Giao tiếp API cơ cấu Khối và Phòng ban
    │   ├── seatService.js            # Giao tiếp API sơ đồ và gán chỗ 200 ghế
    │   └── staffAuthService.js       # Đăng nhập và API đổi mật khẩu cá nhân
    └── utils/
        ├── archive.js                # Tiện ích giải mã và lưu trữ phiên sự kiện
        ├── checkIn.js                # Bộ quy chuẩn kiểm tra hợp lệ điểm danh
        ├── format.js                 # Định dạng thời gian, chuỗi hiển thị
        ├── printQr.css               # CSS tối ưu in ấn khổ giấy A4 tem ghế
        ├── resolveGroup.js           # Thuật toán tìm nhóm ghế theo Khối của đại biểu
        ├── seatLabel.js              # Định dạng nhãn hiển thị vị trí ghế (Hàng - Cánh - Số)
        └── seatSummary.js            # Tính toán thống kê tỷ lệ ghế trống và đã gán
```
