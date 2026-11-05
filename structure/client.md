# BÁO CÁO KIỂM TRA CẤU TRÚC CLIENT & ĐÁNH GIÁ TIÊU CHUẨN MERN

Báo cáo được cập nhật sau khi dọn dẹp các thư viện backend và gói thừa khỏi thư mục `client/` của repository `hoitruongz76-main`.

> **Ghi chú hiện trạng repo**: 
> - Thư mục gốc chứa `client/` (Frontend React + Vite JavaScript thuần), `.gitignore`, tài liệu hướng dẫn và báo cáo cấu trúc. Chưa có thư mục `server/`.
> - Toàn bộ mã nguồn giao diện trong `client/src` đã chạy bằng JavaScript (`.jsx` / `.js`).
> - Đã loại bỏ các gói backend (`express`, `dotenv`), TypeScript thừa và gói AI Studio khỏi `client/package.json`.

---

## MỤC 1: CÂY THƯ MỤC ĐẦY ĐỦ CỦA REPO (DẠNG TREE)
*(Đã loại trừ `node_modules`, `dist`, `.git`, file khóa)*

```text
hoitruongz76-main/
├── .gitignore
├── MERN_MIGRATION_GUIDE.md
├── structure/
│   └── client.md
└── client/
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── metadata.json
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── attendance/
        │   │   └── ScannerModal.jsx
        │   ├── employees/
        │   │   ├── EmployeeFormModal.jsx
        │   │   ├── EmployeeTable.jsx
        │   │   └── ImportExcelModal.jsx
        │   ├── groups/
        │   │   ├── GroupFormModal.jsx
        │   │   └── GroupList.jsx
        │   ├── hall/
        │   │   ├── EntrancePath.jsx
        │   │   ├── geometry.js
        │   │   ├── HallLegend.jsx
        │   │   ├── HallMap.jsx
        │   │   ├── Seat.jsx
        │   │   └── SeatRowEditor.jsx
        │   └── ui/
        │       ├── Badge.jsx
        │       ├── BottomSheet.jsx
        │       ├── Button.jsx
        │       ├── ColorSwatchPicker.jsx
        │       ├── EmptyState.jsx
        │       ├── GroupBadge.jsx
        │       ├── Input.jsx
        │       ├── Modal.jsx
        │       └── Switch.jsx
        ├── constants/
        │   ├── app.js
        │   ├── hall.js
        │   ├── navConfig.js
        │   └── roles.js
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── ConfirmContext.jsx
        │   └── ToastContext.jsx
        ├── data/
        │   └── mockData.js
        ├── hooks/
        │   ├── useAttendance.js
        │   ├── useEmployees.js
        │   ├── useEventSettings.js
        │   ├── useGroups.js
        │   ├── useOrg.js
        │   └── useSeatAssignments.js
        ├── layouts/
        │   ├── AdminLayout.jsx
        │   └── AttendeeLayout.jsx
        ├── pages/
        │   ├── admin/
        │   │   ├── AdminDashboardPage.jsx
        │   │   ├── EmployeesPage.jsx
        │   │   ├── GroupsPage.jsx
        │   │   ├── MaintenancePage.jsx
        │   │   ├── OrgPage.jsx
        │   │   └── SeatingPage.jsx
        │   ├── attendee/
        │   │   ├── DirectCheckInPage.jsx
        │   │   ├── LoginPage.jsx
        │   │   └── SeatPage.jsx
        │   ├── auth/
        │   │   └── StaffLoginPage.jsx
        │   └── manager/
        │       ├── AttendancePage.jsx
        │       ├── ManagerDashboardPage.jsx
        │       └── ManagerEventPage.jsx
        ├── routes/
        │   └── RequireRole.jsx
        ├── services/
        │   ├── api.js
        │   ├── attendanceService.js
        │   ├── attendeeService.js
        │   ├── authService.js
        │   ├── backupService.js
        │   ├── employeeService.js
        │   ├── eventService.js
        │   ├── groupService.js
        │   ├── index.js
        │   ├── orgService.js
        │   ├── seatService.js
        │   └── staffAuthService.js
        └── utils/
            ├── checkIn.js
            ├── excel.js
            ├── printQr.css
            ├── resolveGroup.js
            ├── seatLabel.js
            ├── seatSummary.js
            └── staffAuth.js
```

---

## MỤC 2: BẢNG TỪNG FILE TRONG `client/`

| Đường dẫn file | Vai trò (1 câu ngắn) | Import chính / Phụ thuộc | Nguồn dữ liệu |
|---|---|---|---|
| `client/package.json` | Khai báo các gói thư viện và script quản lý client chuẩn ReactJS | react, vite, tailwindcss, axios... | Không có |
| `client/vite.config.js` | Cấu hình bundler Vite, alias `@` và proxy chuyển tiếp `/api` | `@vitejs/plugin-react`, `@tailwindcss/vite` | Không có |
| `client/tsconfig.json` | File cấu hình TypeScript còn sót lại từ template ban đầu | Không có | Không có |
| `client/index.html` | Trang HTML gốc chứa thẻ gắn DOM `#root` | `src/main.jsx` | Không có |
| `client/metadata.json` | File siêu dữ liệu cấu hình dự án của AI Studio | Không có | Không có |
| `client/.gitignore` | Khai báo các file và thư mục bỏ qua khi dùng Git | Không có | Không có |
| `client/.env.example` | Mẫu khai báo biến môi trường API `VITE_API_URL` | Không có | Không có |
| `client/src/main.jsx` | Điểm khởi đầu mount React ứng dụng vào phần tử DOM | `react-dom/client`, `App.jsx`, `index.css` | Không có |
| `client/src/App.jsx` | Khai báo bộ định tuyến Router và các tuyến đường | `react-router-dom`, các context providers, các pages | Không có |
| `client/src/index.css` | File định kiểu Tailwind CSS và các keyframe hiệu ứng đồ họa | `@import "tailwindcss"` | Không có |
| `client/src/constants/app.js` | Định nghĩa biến cờ môi trường demo `DEMO_MODE` | Không có | Không có |
| `client/src/constants/roles.js` | Định nghĩa danh mục vai trò người dùng và nhóm khách mời | Không có | Không có |
| `client/src/constants/hall.js` | Định nghĩa quy cách số lượng ghế, hàng VIP và bảng màu | Không có | Không có |
| `client/src/constants/navConfig.js` | Cấu hình danh mục menu điều hướng cho Admin và Quản lý | `lucide-react`, `roles.js` | Không có |
| `client/src/data/mockData.js` | Chứa dữ liệu mẫu ban đầu về khối, phòng ban, nhân viên, ghế | `roles.js`, `hall.js` | Mock |
| `client/src/context/AuthContext.jsx` | Quản lý trạng thái phiên đăng nhập của người tham dự và staff | `attendeeService`, `staffAuthService`, `groupService` | localStorage |
| `client/src/context/ToastContext.jsx` | Cung cấp thông báo dạng pop-up toast trên toàn ứng dụng | `lucide-react` | Không có |
| `client/src/context/ConfirmContext.jsx` | Quản lý hộp thoại pop-up xác nhận hành động nguy hiểm | `lucide-react` | Không có |
| `client/src/routes/RequireRole.jsx` | Bảo vệ các tuyến đường theo vai trò người dùng | `AuthContext.jsx`, `roles.js` | localStorage (qua context) |
| `client/src/layouts/AttendeeLayout.jsx` | Khung giao diện dùng chung cho người tham dự hội trường | `AuthContext.jsx`, `lucide-react` | localStorage (qua context) |
| `client/src/layouts/AdminLayout.jsx` | Khung giao diện dùng chung cho trang quản trị và quản lý | `AuthContext.jsx`, `navConfig.js`, `lucide-react` | localStorage (qua context) |
| `client/src/pages/attendee/LoginPage.jsx` | Giao diện đăng nhập cho nhân viên và đăng ký khách mời | `AuthContext.jsx`, `useEventSettings.js` | localStorage |
| `client/src/pages/attendee/SeatPage.jsx` | Trang hiển thị vị trí ghế ngồi và nút quét QR điểm danh | `useSeatAssignments.js`, `useGroups.js`, `useAttendance.js` | localStorage |
| `client/src/pages/attendee/DirectCheckInPage.jsx` | Trang xử lý điểm danh trực tiếp khi quét link tem ghế | `useSeatAssignments.js`, `useAttendance.js`, `checkIn.js` | localStorage |
| `client/src/pages/auth/StaffLoginPage.jsx` | Trang đăng nhập riêng biệt dành cho Admin và Quản lý | `AuthContext.jsx`, `roles.js` | localStorage |
| `client/src/pages/admin/AdminDashboardPage.jsx` | Trang tổng quan số liệu thống kê quản trị hệ thống | `useEmployees.js`, `useOrg.js`, `roles.js` | localStorage |
| `client/src/pages/admin/EmployeesPage.jsx` | Trang quản lý danh sách nhân sự và phân quyền tài khoản | `useEmployees.js`, `useOrg.js`, `EmployeeTable.jsx` | localStorage |
| `client/src/pages/admin/OrgPage.jsx` | Trang quản lý cơ cấu tổ chức gồm Khối và Phòng ban | `useOrg.js`, `useEmployees.js`, `Modal.jsx` | localStorage |
| `client/src/pages/admin/MaintenancePage.jsx` | Trang sao lưu và khôi phục toàn bộ dữ liệu ứng dụng | `backupService.js`, `ToastContext.jsx`, `ConfirmContext.jsx` | localStorage |
| `client/src/pages/admin/GroupsPage.jsx` | Trang quản lý nhóm hội trường và liên kết khối | `useGroups.js`, `useEmployees.js`, `useSeatAssignments.js` | localStorage |
| `client/src/pages/admin/SeatingPage.jsx` | Trang thao tác gán nhóm cho các hàng ghế và từng ghế | `useGroups.js`, `useSeatAssignments.js`, `HallMap.jsx` | localStorage |
| `client/src/pages/manager/ManagerDashboardPage.jsx` | Trang theo dõi tổng quan sắp chỗ và tỷ lệ điểm danh | `useGroups.js`, `useSeatAssignments.js`, `useAttendance.js` | localStorage |
| `client/src/pages/manager/AttendancePage.jsx` | Bảng theo dõi điểm danh, lọc dữ liệu và xuất Excel | `useAttendance.js`, `useEmployees.js`, `useOrg.js`, `xlsx` | localStorage |
| `client/src/pages/manager/ManagerEventPage.jsx` | Trang cài đặt sự kiện và in tem dán mã QR ghế ngồi | `useEventSettings.js`, `qrcode.react`, `printQr.css` | localStorage |
| `client/src/services/api.js` | Cấu hình axios kết nối máy chủ API và gán Bearer Token | `axios` | API |
| `client/src/services/attendeeService.js` | Xử lý tra cứu mã nhân sự và phiên của người tham dự | `employeeService.js`, `groupService.js` | localStorage (fallback Mock) |
| `client/src/services/staffAuthService.js` | Xác thực đăng nhập quản trị và quản lý phiên 8 giờ | `staffAuth.js`, `employeeService.js` | localStorage |
| `client/src/services/authService.js` | Cầu nối tương thích tổng hợp giữa attendee và staff auth | `attendeeService.js`, `staffAuthService.js` | localStorage |
| `client/src/services/employeeService.js` | Xử lý thêm, sửa, xóa, import dữ liệu nhân viên | `mockData.js`, `roles.js` | localStorage (fallback Mock) |
| `client/src/services/orgService.js` | Xử lý thêm, sửa, xóa các Khối và Phòng ban | `mockData.js` | localStorage (fallback Mock) |
| `client/src/services/groupService.js` | Xử lý thêm, sửa, xóa và đếm tải của các nhóm hội trường | `mockData.js`, `resolveGroup.js` | localStorage (fallback Mock) |
| `client/src/services/index.js` | Xuất tập trung toàn bộ các service trong thư mục `services` | Toàn bộ service con | Không có |
| `client/src/services/seatService.js` | Xử lý gán và hủy gán vị trí ghế hội trường | `mockData.js`, `hall.js` | localStorage (fallback Mock) |
| `client/src/services/attendanceService.js` | Xử lý ghi nhận điểm danh và danh sách điểm danh | `mockData.js` | localStorage (fallback Mock) |
| `client/src/services/eventService.js` | Quản lý tên sự kiện, mở điểm danh và token dán ghế | `mockData.js` | localStorage (fallback Mock) |
| `client/src/services/backupService.js` | Xuất và nhập toàn bộ các key dữ liệu từ localStorage | `mockData.js` | localStorage |
| `client/src/hooks/useEmployees.js` | Hook tương tác và cập nhật trạng thái danh sách nhân sự | `employeeService.js` | localStorage (qua service) |
| `client/src/hooks/useOrg.js` | Hook quản lý dữ liệu Khối và Phòng ban | `orgService.js` | localStorage (qua service) |
| `client/src/hooks/useGroups.js` | Hook quản lý danh mục nhóm hội trường | `groupService.js` | localStorage (qua service) |
| `client/src/hooks/useSeatAssignments.js` | Hook quản lý trạng thái phân bổ ghế ngồi | `seatService.js` | localStorage (qua service) |
| `client/src/hooks/useAttendance.js` | Hook theo dõi và thao tác điểm danh đại biểu | `attendanceService.js` | localStorage (qua service) |
| `client/src/hooks/useEventSettings.js` | Hook quản lý cấu hình thông số sự kiện | `eventService.js` | localStorage (qua service) |
| `client/src/utils/staffAuth.js` | Hàm thuần so khớp mã đăng nhập và mật khẩu tài khoản staff | `roles.js` | Không có |
| `client/src/utils/resolveGroup.js` | Hàm ánh xạ nhân viên vào nhóm dựa theo khối tổ chức | `roles.js` | Không có |
| `client/src/utils/checkIn.js` | Kiểm tra điều kiện hợp lệ khi đại biểu quét QR điểm danh | `hall.js`, `roles.js` | Không có |
| `client/src/utils/excel.js` | Xử lý đọc file Excel nhập nhân sự và tạo file Excel mẫu | `xlsx`, `roles.js` | Không có |
| `client/src/utils/seatLabel.js` | Định dạng chuỗi hiển thị tên ghế tự nhiên và in tem | `hall.js` | Không có |
| `client/src/utils/seatSummary.js` | Gộp dải ghế thành câu mô tả ngắn gọn | Không có | Không có |
| `client/src/utils/printQr.css` | Định kiểu riêng cho trang in mã QR A4 và tem dán ghế | Không có | Không có |
| `client/src/components/ui/Button.jsx` | Nút bấm giao diện chuẩn hóa hỗ trợ kích thước và biến thể | Không có | Không có |
| `client/src/components/ui/Input.jsx` | Ô nhập liệu chuẩn hóa có hiển thị lỗi và nhãn | `lucide-react` | Không có |
| `client/src/components/ui/Badge.jsx` | Nhãn trạng thái nhỏ nhiều màu | Không có | Không có |
| `client/src/components/ui/Modal.jsx` | Cửa sổ popup nền tối khóa cuộn trang | `lucide-react` | Không có |
| `client/src/components/ui/BottomSheet.jsx` | Bảng trượt từ đáy màn hình dành riêng cho điện thoại | `lucide-react` | Không có |
| `client/src/components/ui/GroupBadge.jsx` | Huy hiệu hiển thị tên nhóm kèm chấm tròn màu | Không có | Không có |
| `client/src/components/ui/Switch.jsx` | Nút gạt bật/tắt chuẩn accessibility | Không có | Không có |
| `client/src/components/ui/EmptyState.jsx` | Khung hiển thị khi danh sách dữ liệu trống | `Button.jsx` | Không có |
| `client/src/components/ui/ColorSwatchPicker.jsx` | Bảng chọn 8 màu sắc chuẩn cho nhóm ghế | `lucide-react`, `hall.js` | Không có |
| `client/src/components/attendance/ScannerModal.jsx` | Popup quét mã QR từ camera thiết bị | `html5-qrcode`, `app.js` | Không có |
| `client/src/components/employees/EmployeeTable.jsx` | Bảng danh sách nhân viên có tìm kiếm và bộ lọc | `Badge.jsx`, `Button.jsx`, `EmptyState.jsx` | Không có |
| `client/src/components/employees/EmployeeFormModal.jsx` | Popup thêm mới hoặc chỉnh sửa nhân sự | `Modal.jsx`, `Input.jsx`, `Button.jsx` | Không có |
| `client/src/components/employees/ImportExcelModal.jsx` | Popup đọc và xem trước kết quả nhập Excel | `Modal.jsx`, `Button.jsx`, `excel.js` | Không có |
| `client/src/components/groups/GroupList.jsx` | Danh sách hiển thị nhóm hội trường và số lượng ghế | `Button.jsx`, `Badge.jsx`, `roles.js` | Không có |
| `client/src/components/groups/GroupFormModal.jsx` | Popup tạo và sửa nhóm hội trường | `Modal.jsx`, `Input.jsx`, `ColorSwatchPicker.jsx` | Không có |
| `client/src/components/hall/HallMap.jsx` | Bản đồ SVG 2D mô phỏng 200 ghế hội trường Z176 | `hall.js`, `geometry.js`, `Seat.jsx`, `EntrancePath.jsx` | Không có |
| `client/src/components/hall/geometry.js` | Hàm tính toán tọa độ SVG cho sân khấu, ghế và đường đi | `hall.js` | Không có |
| `client/src/components/hall/Seat.jsx` | Phần tử hiển thị 1 ghế ngồi SVG | Không có | Không có |
| `client/src/components/hall/EntrancePath.jsx` | Vẽ đường dẫn nét đứt chuyển động từ cửa vào hàng ghế | Không có | Không có |
| `client/src/components/hall/HallLegend.jsx` | Bảng chú thích màu sắc các nhóm ghế | `GroupBadge.jsx` | Không có |
| `client/src/components/hall/SeatRowEditor.jsx` | Popup chọn gán nhóm cho từng ghế đơn lẻ trong hàng | `Modal.jsx`, `BottomSheet.jsx`, `Button.jsx` | Không có |

---

## MỤC 3: KẾT QUẢ CHECKLIST MERN

- [ ] **Client dùng React + JavaScript thuần: còn file `.ts`, `.tsx`, `tsconfig`, gói `typescript`, `@types/*` không?**
  - **Kết quả: ⚠️ Đã dọn gói npm, còn file config**
  - **Bằng chứng**:
    - Đã gỡ bỏ sạch sẽ các gói khỏi `client/package.json`: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/express`.
    - File `client/tsconfig.json` vẫn còn lưu trữ trên ổ đĩa.
    - Toàn bộ code trong `client/src` đều là `.jsx` và `.js`.

- [ ] **`package.json` của client còn thư viện thuộc backend hoặc thừa không?**
  - **Kết quả: ✅ Đã đạt (Đã dọn dẹp sạch sẽ)**
  - **Bằng chứng**:
    - `client/package.json` đã loại bỏ hoàn toàn: `express`, `dotenv`, `@google/genai`, `tsx`, `esbuild`.
    - Đã bổ sung `axios` chuẩn bị cho kết nối API Backend.

- [ ] **Dữ liệu client đang lấy từ đâu (Mock / localStorage / API)?**
  - **Kết quả: ❌ Chưa đạt chuẩn MERN (Đang dùng localStorage)**
  - **Bằng chứng**:
    - Toàn bộ service trong `client/src/services/` đang lưu trữ vào `localStorage` kèm mock data dự phòng.
    - Cấu hình API trung tâm [api.js](file:///d:/code%20file/hoitruongz76-main/client/src/services/api.js) đã sẵn sàng để tích hợp khi backend khởi động.

- [ ] **Đăng nhập và phân quyền đang xử lý ở client hay đã gọi server?**
  - **Kết quả: ❌ Đang xử lý hoàn toàn ở Client**
  - **Bằng chứng**:
    - `client/src/utils/staffAuth.js`: So khớp trực tiếp mật khẩu từ `mockData/localStorage`.
    - `client/src/services/staffAuthService.js`: Lưu phiên trực tiếp vào `localStorage`.

- [ ] **Có `server/` chưa?**
  - **Kết quả: ❌ Chưa có**
  - **Bằng chứng**: Repo chưa khởi tạo thư mục `server/` (Node.js/Express + Mongoose).

- [ ] **Có cấu hình proxy hoặc biến môi trường trỏ client tới API chưa?**
  - **Kết quả: ✅ Đã đạt**
  - **Bằng chứng**:
    - `client/vite.config.js`: Đã bổ sung mục `server.proxy` chuyển tiếp `/api` về cổng `5000`.
    - `client/.env.example`: Đã cấu hình `VITE_API_URL=http://localhost:5000/api`.

- [ ] **`.gitignore` có chặn `node_modules`, `.env`, `dist` chưa?**
  - **Kết quả: ✅ Đã đạt**
  - **Bằng chứng**: Đã tạo file `.gitignore` ở thư mục gốc repo chặn toàn bộ `node_modules/`, `dist/`, `.env*` cho cả client và server sau này.

- [ ] **File thừa từ template AI Studio?**
  - **Kết quả: ⚠️ Còn file `metadata.json`**
  - **Bằng chứng**: Gói `@google/genai` và cấu hình env AI Studio đã được dọn, còn lại file `client/metadata.json`.

---

## MỤC 4: DANH SÁCH VIỆC CẦN LÀM ĐỂ THÀNH MERN CHUẨN (ƯU TIÊN GIẢM DẦN)

1. **Khởi tạo thư mục Backend độc lập (`server/`)**:
   - Cài đặt `express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`.
   - Tạo file `server/server.js`, thư mục `config/db.js` để kết nối MongoDB.
   - Tạo file `server/.env.example` chứa `PORT=5000`, `MONGO_URI`, `JWT_SECRET`.

2. **Chuyển logic Đăng nhập & Xác thực về Backend (Security)**:
   - Viết API `POST /api/auth/staff-login`: Sử dụng `bcrypt` so khớp mật khẩu và phát hành JWT token.
   - Cập nhật `client/src/services/staffAuthService.js` gọi qua `api.post('/auth/staff-login')`.

3. **Chuyển dữ liệu sang Database MongoDB *(ĐỀ XUẤT - CẦN NGƯỜI DÙNG DUYỆT)***:
   - Xây dựng Mongoose models và viết các REST API tương ứng cho các thực thể.
   - Chuyển mã nguồn trong các file `client/src/services/*Service.js` từ việc đọc `localStorage` sang gọi HTTP request qua `api.js`.

---

## MỤC 5: GỢI Ý CÁC COLLECTION MONGODB *(CHỈ GỢI Ý, CẦN NGƯỜI DÙNG DUYỆT)*

1. **Collection `blocks` (Khối)**:
   - Trường: `_id`, `id` (chuỗi định danh, ví dụ: 'block-agency'), `name` (tên khối), `createdAt`, `updatedAt`.
   - Tương ứng với dữ liệu trong `orgService.js`.

2. **Collection `departments` (Phòng ban)**:
   - Trường: `_id`, `id`, `name`, `blockId` (tham chiếu đến `blocks`), `createdAt`, `updatedAt`.
   - Tương ứng với dữ liệu trong `orgService.js`.

3. **Collection `employees` (Nhân sự & Tài khoản)**:
   - Trường: `_id`, `code` (Mã NV, đánh index unique), `name`, `role` (ADMIN, MANAGER, EMPLOYEE, GUEST), `departmentId`, `blockId`, `password` (hash bcrypt đối với ADMIN/MANAGER), `createdAt`, `updatedAt`.
   - Tương ứng với `employeeService.js` và `staffAuthService.js`.

4. **Collection `groups` (Nhóm ghế hội trường)**:
   - Trường: `_id`, `id`, `name`, `color` (mã màu hex), `isSystem` (boolean), `checkInRequired` (boolean), `blockIds` (mảng các blockId được gán vào nhóm), `seatIds` (danh sách các ghế thuộc nhóm: mảng chuỗi `["1-L-1", "1-L-2", ...]`).
   - Tương ứng với `groupService.js` và `seatService.js`.

5. **Collection `events` (Cấu hình sự kiện & Điểm danh)**:
   - Trường: `_id`, `eventName`, `guestEnabled` (boolean), `checkInOpen` (boolean), `appUrl`, `seatTokens` (Object map seatId -> secret token).
   - Tương ứng với `eventService.js`.

6. **Collection `attendances` (Lịch sử điểm danh)**:
   - Trường: `_id`, `employeeCode` (tham chiếu mã nhân viên), `seatId` (mã ghế), `checkedInAt` (thời gian điểm danh Date/ISO), `eventId` (nếu quản lý đa sự kiện).
   - Tương ứng với `attendanceService.js`.
