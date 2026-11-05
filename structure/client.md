# BÁO CÁO CẤU TRÚC CLIENT & HIỆN TRẠNG KIẾN TRÚC HỆ THỐNG HỘI TRƯỜNG Z176

Báo cáo mô tả toàn bộ cấu trúc thư mục, danh mục linh kiện (components), trang màn hình (pages), dịch vụ (services), tiện ích (utils) và hiện trạng kết nối của phân hệ Client React/Vite.

> **Tổng quan hệ thống Client**:
> - Nền tảng: **React 18 / 19** với **Vite 6.x** sử dụng JavaScript thuần (`.jsx`, `.js`).
> - Định kiểu: **Tailwind CSS v4** (`@tailwindcss/vite`), biểu tượng **Lucide React**.
> - Bộ định tuyến: **React Router DOM v7**.
> - UI Component Chuẩn hóa: Thiết kế hệ thống Input, Button, Switch, Modal, Badge, BottomSheet và dropdown tùy chỉnh **Select** giải quyết triệt để lỗi tràn giao diện.
> - Tính năng mở rộng gần đây:
>   - Modal nhóm ghế (`GroupFormModal.jsx`): Hỗ trợ chế độ tạo nhanh 1-click từ Khối có sẵn và chế độ tùy chỉnh riêng.
>   - Bảng màu (`ColorSwatchPicker.jsx` & `hall.js`): Mở rộng từ 8 lên 18 màu chuẩn nhận diện cao.
>   - In tem dán ghế (`ManagerEventPage.jsx` & `printQr.css`): Hỗ trợ 3 cỡ tem in A4 (Tiêu chuẩn 24 tem, Cỡ lớn rõ nét 12 tem cấp sửa lỗi H, Cực đại 6 tem).
>   - Bảng điều khiển Quản trị (`AdminDashboardPage.jsx`): Thiết kế giao diện KPI, biểu đồ phân bổ tỷ lệ khối và nghiêm ngặt bảo đảm phân quyền vai trò.

---

## MỤC 1: CÂY THƯ MỤC CLIENT (TREE)
*(Đã loại trừ `node_modules`, `dist`, `.git`, file khóa)*

```text
client/
├── .env.example              # Mẫu khai báo API URL kết nối backend (VITE_API_URL)
├── .gitignore                # Bỏ qua dist, node_modules, biến môi trường cá nhân
├── index.html                # Trang HTML gốc gắn root DOM
├── metadata.json             # Siêu dữ liệu mô tả cấu hình dự án
├── package.json              # Khai báo dependencies thuần client: react, react-dom, react-router-dom, lucide-react, qrcode.react, html5-qrcode, xlsx, axios
├── tsconfig.json             # Cấu hình kiểm tra cú pháp JS/JSX
├── vite.config.js            # Cấu hình Vite bundler, alias và proxy reverse /api sang server:5000
└── src/
    ├── App.jsx               # Khai báo tuyến đường, bọc Context Providers và phân quyền vai trò
    ├── index.css             # Import Tailwind CSS v4 và định kiểu chung
    ├── main.jsx              # Entry point render App vào DOM
    ├── components/
    │   ├── attendance/
    │   │   └── ScannerModal.jsx      # Modal quét mã QR điểm danh trực tiếp qua camera thiết bị
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
    │       ├── Input.jsx             # Ô nhập liệu có nhãn, hiển thị lỗi và helper text
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
    ├── data/
    │   └── mockData.js               # Dữ liệu mẫu ban đầu (khối, phòng ban, nhân viên, 200 ghế)
    ├── hooks/
    │   ├── useAttendance.js          # Hook theo dõi và thao tác điểm danh đại biểu
    │   ├── useEmployees.js           # Hook quản lý danh sách nhân sự và phân quyền
    │   ├── useEventSettings.js       # Hook cấu hình thông số sự kiện, token ghế, mở/đóng điểm danh
    │   ├── useGroups.js              # Hook quản lý danh mục nhóm hội trường và liên kết khối
    │   ├── useOrg.js                 # Hook quản lý danh mục Khối và Phòng ban
    │   └── useSeatAssignments.js     # Hook theo dõi và gán chỗ ngồi trên sơ đồ
    ├── layouts/
    │   ├── AdminLayout.jsx           # Bố cục chuẩn dùng chung cho phân hệ Quản trị và Quản lý
    │   └── AttendeeLayout.jsx        # Bố cục tối ưu di động cho đại biểu tham dự
    ├── pages/
    │   ├── admin/
    │   │   ├── AdminDashboardPage.jsx# Bảng điều khiển KPI quản trị, thống kê nhân sự theo khối
    │   │   ├── EmployeesPage.jsx     # Trang quản lý nhân sự, lọc phòng ban/khối bằng Select.jsx
    │   │   ├── MaintenancePage.jsx   # Trang sao lưu, phục hồi dữ liệu hệ thống
    │   │   └── OrgPage.jsx           # Trang thiết lập cơ cấu tổ chức (Khối & Phòng ban)
    │   ├── attendee/
    │   │   ├── DirectCheckInPage.jsx # Trang xử lý tự động điểm danh khi đại biểu quét QR ghế
    │   │   ├── LoginPage.jsx         # Giao diện đại biểu tra cứu mã NV hoặc đăng ký khách mời
    │   │   └── SeatPage.jsx          # Màn hình đại biểu xem vị trí ghế chỉ định và quét điểm danh
    │   ├── auth/
    │   │   └── StaffLoginPage.jsx    # Trang đăng nhập bảo mật dành riêng cho Admin và Quản lý
    │   └── manager/
    │       ├── AttendancePage.jsx    # Bảng giám sát điểm danh trực tiếp, lọc khối/phòng, xuất Excel
    │       ├── GroupsPage.jsx        # Trang quản lý nhóm ghế, thiết lập màu sắc và quy định điểm danh
    │       ├── ManagerDashboardPage.jsx # Tổng quan tiến độ sắp chỗ và tỷ lệ điểm danh theo nhóm
    │       ├── ManagerEventPage.jsx  # Cài đặt sự kiện & in mã QR dán cửa, tem dán ghế (3 kích cỡ)
    │       └── SeatingPage.jsx       # Bản đồ trực quan xếp chỗ 200 ghế theo nhóm
    ├── routes/
    │   └── RequireRole.jsx           # Middleware bảo vệ tuyến đường theo danh sách quyền cho phép
    ├── services/
    │   ├── api.js                    # Cấu hình Axios instance kết nối máy chủ API Backend
    │   ├── attendanceService.js      # Dịch vụ điểm danh, danh sách tham dự
    │   ├── attendeeService.js        # Dịch vụ tra cứu mã nhân sự đại biểu tham dự
    │   ├── authService.js            # Cầu nối tổng hợp xác thực phiên
    │   ├── backupService.js          # Xuất/nhập toàn bộ dữ liệu ứng dụng
    │   ├── employeeService.js        # Thao tác dữ liệu nhân viên, tài khoản
    │   ├── eventService.js           # Cấu hình sự kiện, token bảo mật ghế
    │   ├── groupService.js           # Quản lý nhóm ghế, kiểm tra xung đột khối
    │   ├── index.js                  # Export tập trung các dịch vụ
    │   ├── orgService.js             # Quản lý Khối cơ quan và Phòng ban
    │   ├── seatService.js            # Quản lý trạng thái 200 ghế hội trường
    │   └── staffAuthService.js       # Xác thực tài khoản Admin/Manager, lưu phiên
    └── utils/
        ├── checkIn.js                # Logic kiểm tra tính hợp lệ khi quét mã QR tem ghế
        ├── excel.js                  # Tiện ích đọc và xuất file Excel bằng thư viện xlsx
        ├── printQr.css               # Định kiểu in ấn giấy A4 cho tờ dán cửa và tem ghế 3 kích cỡ
        ├── resolveGroup.js           # Hàm xác định nhóm ghế tương ứng của nhân viên theo khối
        ├── seatLabel.js              # Định dạng chuỗi hiển thị tên ghế (Hàng X - Bên Trái/Phải - Ghế Y)
        ├── seatSummary.js            # Gom dải ghế thành mô tả ngắn gọn trực quan
        └── staffAuth.js              # Tiện ích xác thực thông tin đăng nhập tài khoản
```

---

## MỤC 2: BẢNG CHI TIẾT FILE VÀ PHỤ THUỘC TẠI `client/`

| Đường dẫn file | Vai trò chính | Thư viện & Module phụ thuộc | Trạng thái nguồn dữ liệu |
|---|---|---|---|
| `client/src/components/ui/Select.jsx` | Dropdown tùy chỉnh thay thế thẻ select native, ngăn tràn giao diện, hỗ trợ search/scroll | `lucide-react` | Nhận qua props |
| `client/src/components/ui/ColorSwatchPicker.jsx` | Bộ chọn bảng màu trực quan cho nhóm ghế (18 màu chuẩn) | `lucide-react`, `hall.js` | Nhận qua props |
| `client/src/components/groups/GroupFormModal.jsx` | Modal tạo nhóm 2 chế độ: chọn nhanh Khối có sẵn hoặc tạo nhóm riêng tùy chỉnh | `Modal.jsx`, `Input.jsx`, `ColorSwatchPicker.jsx`, `Switch.jsx` | Nhận qua props |
| `client/src/pages/manager/ManagerEventPage.jsx` | Cài đặt sự kiện, in tờ dán cửa và in tem ghế 3 kích cỡ (24 tem, 12 tem, 6 tem/A4) | `useEventSettings.js`, `qrcode.react`, `printQr.css`, `Switch.jsx` | Service / Event context |
| `client/src/utils/printQr.css` | Định dạng trang in chuyên nghiệp cho QR dán cửa A4 và tem dán ghế theo cỡ M, L, XL | CSS thuần | Không có |
| `client/src/constants/hall.js` | Quy chuẩn sơ đồ hội trường 200 ghế và bảng 18 mã màu đại diện | Không có | Hằng số hệ thống |
| `client/src/pages/admin/AdminDashboardPage.jsx` | Dashboard chỉ số tổng quan hệ thống nhân sự, phân bổ khối, đảm bảo phân quyền | `useEmployees.js`, `useOrg.js`, `roles.js`, `lucide-react` | Hook / Service |
| `client/src/components/employees/EmployeeTable.jsx` | Bảng nhân sự tích hợp Select dropdown chuẩn hóa cho Khối, Phòng ban và Vai trò | `Select.jsx`, `Badge.jsx`, `Button.jsx` | Nhận qua props |
| `client/src/pages/manager/AttendancePage.jsx` | Bảng điểm danh thời gian thực tích hợp Select dropdown lọc Khối và Trạng thái | `Select.jsx`, `useAttendance.js`, `useOrg.js`, `xlsx` | Hook / Service |
| `client/src/pages/admin/OrgPage.jsx` | Quản lý Khối & Phòng ban tích hợp Select dropdown chọn Khối trực thuộc | `Select.jsx`, `useOrg.js`, `Modal.jsx` | Hook / Service |
| `client/src/components/attendance/ScannerModal.jsx` | Quét mã QR camera thiết bị tích hợp Select dropdown chọn camera nguồn | `Select.jsx`, `html5-qrcode` | Hook / Web API |
| `client/src/App.jsx` | Phân phối luồng định tuyến và bảo vệ truy cập theo vai trò (Admin / Manager riêng biệt) | `react-router-dom`, `RequireRole.jsx`, `navConfig.js` | Context |

---

## MỤC 3: ĐÁNH GIÁ CHUẨN MERN VÀ TIẾN ĐỘ TÍCH HỢP

- [x] **Dọn dẹp mã nguồn Client**: 100% sử dụng React JSX/JS thuần, không còn các gói backend hay mã dư thừa.
- [x] **Cấu trúc Backend Server độc lập (`server/`)**: Đã hoàn thiện toàn bộ cấu trúc thư mục Node.js/Express, Mongoose ODM, JWT Auth, bộ kiểm soát lỗi và dữ liệu Seed đầy đủ tại thư mục `server/`.
- [x] **Trải nghiệm người dùng (UX) đạt chuẩn nghiệp vụ**:
  - Loại bỏ hoàn toàn lỗi tràn khung khi xổ danh sách chọn (`Select.jsx`).
  - Đơn giản hóa quy trình tạo nhóm ghế: Lấy từ Khối có sẵn kèm chọn màu (18 màu).
  - Khắc phục tem QR dán ghế bị nhỏ khi in ấn: Bổ sung cỡ tem Lớn (12 tem/A4, mã QR size 130, mức sửa sai High) và Cực Đại (6 tem/A4).
- [ ] **Chuyển đổi dữ liệu từ LocalStorage sang API MongoDB**: Client hiện sẵn sàng file cấu hình Axios kết nối API tại `client/src/services/api.js`. Các service có thể chuyển dần sang gọi endpoint backend qua biến `VITE_API_URL`.
