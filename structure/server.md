# BÁO CÁO CẤU TRÚC BACKEND SERVER & TIÊU CHUẨN KIẾN TRÚC MERN (NODE.JS + EXPRESS + MONGODB)

Tài liệu mô tả chi tiết kiến trúc, cấu trúc thư mục, danh mục API routes, data models và cơ chế bảo mật của tầng Backend (`server/`) thuộc hệ thống Hội trường Z176.

> **Tổng quan hệ thống Backend**:
> - Nền tảng: **Node.js (>=20)** với **ES Module (`"type": "module"`)**.
> - Framework Web: **Express 5.x**.
> - Cơ sở dữ liệu: **MongoDB** tương tác qua **Mongoose 9.x**.
> - Bảo mật & Xác thực:
>   - **JWT (JSON Web Token)**: Bắt buộc thuật toán HS256, khóa bí mật tối thiểu 32 ký tự.
>   - **Bcryptjs**: Băm mật khẩu quản trị chuẩn một chiều an toàn (salt factor 10).
>   - **Rate Limiting**: Giới hạn đăng nhập và tra cứu chống brute-force và quét dò dữ liệu.
>   - **Audit Trail**: Ghi nhận toàn bộ thao tác nhạy cảm vào bảng `Audit` không thể chỉnh sửa.
>   - **CLI Recovery**: Script `resetAdmin.js` phục hồi tài khoản Admin trực tiếp từ máy chủ.

---

## MỤC 1: CÂY THƯ MỤC BACKEND SERVER (TREE)
*(Đã loại trừ `node_modules`, file rác)*

```text
server/
├── .env                  # Biến môi trường (PORT, MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, SEED_*_PASSWORD)
├── package.json          # Danh sách thư viện và kịch bản (dev, start, seed, seed:force, reset-admin)
├── server.js             # Entry point khởi động ứng dụng và kết nối MongoDB
└── src/
    ├── app.js            # Khởi tạo Express, cấu hình middleware tập trung và gắn routes
    ├── config/           # Cấu hình môi trường & cơ sở dữ liệu
    │   ├── db.js         # Kết nối và ngắt kết nối Mongoose / MongoDB
    │   └── env.js        # Đọc và kiểm tra tính hợp lệ của biến môi trường (.env)
    ├── constants/        # Các hằng số nghiệp vụ dùng cho server
    │   ├── app.server.js     # Hằng số thời lượng phiên, cấu hình chung
    │   ├── hall.server.js    # Cấu hình kích thước hội trường 200 ghế, regex mã ghế (seatId)
    │   └── roles.server.js   # Danh mục quyền: ADMIN, MANAGER, EMPLOYEE, GUEST
    ├── controllers/      # Bộ xử lý nghiệp vụ chính (Controller Layer)
    │   ├── attendance.controller.js  # Điểm danh, điểm danh hộ, tra cứu lịch sử, đặt lại điểm danh
    │   ├── audit.controller.js       # Tra cứu lịch sử kiểm toán thao tác hệ thống
    │   ├── auth.controller.js        # Đăng nhập Staff, đổi mật khẩu, tra cứu đại biểu, tạo khách mời
    │   ├── employee.controller.js    # CRUD nhân sự, phân quyền, import danh sách Excel
    │   ├── event.controller.js       # Cài đặt sự kiện, token ghế, cấu hình điểm danh
    │   ├── group.controller.js       # CRUD nhóm ghế hội trường, kiểm tra ràng buộc khối
    │   ├── maintenance.controller.js # Sao lưu dữ liệu JSON và phục hồi hệ thống
    │   ├── org.controller.js         # CRUD Khối (Blocks) & Phòng ban (Departments)
    │   └── seat.controller.js        # Quản lý 200 ghế, gán nhóm ghế lẻ, gán theo hàng
    ├── middleware/       # Các Middleware xác thực, ủy quyền và xử lý lỗi
    │   ├── auth.js           # authenticate (xác thực JWT) & authorize (kiểm tra Role)
    │   ├── errorHandler.js   # Bắt lỗi tập trung (errorHandler) & 404 (notFound)
    │   └── rateLimit.js      # Giới hạn tần suất gọi API chống tấn công lặp
    ├── models/           # Định nghĩa cấu trúc Schema MongoDB (Mongoose ODM)
    │   ├── _clean.js         # Hàm tiện ích làm sạch JSON (bỏ _id, __v, thông tin nhạy cảm)
    │   ├── Attendance.js     # Bản ghi điểm danh (employeeCode, seatId, checkedInAt)
    │   ├── Audit.js          # Nhật ký thao tác hệ thống (action, actor, details, createdAt)
    │   ├── Block.js          # Khối cơ quan (id, name)
    │   ├── Department.js     # Phòng ban trực thuộc khối (id, name, blockId)
    │   ├── Employee.js       # Nhân sự (code, name, role, departmentId, blockId, passwordHash)
    │   ├── EventHistory.js   # Lịch sử lưu trữ dữ liệu các phiên sự kiện cũ
    │   ├── EventSetting.js   # Cài đặt hội nghị (eventName, guestEnabled, checkInOpen, appUrl)
    │   ├── Group.js          # Nhóm ghế (id, name, color, checkInRequired, blockIds)
    │   ├── index.js          # Điểm xuất tập trung các Models
    │   └── Seat.js           # 200 ghế ngồi (seatId, groupId, token bảo mật dán trên ghế)
    ├── routes/           # Định nghĩa Endpoint và gắn Middleware phân quyền
    │   ├── attendance.routes.js  # Tuyến đường điểm danh & điểm danh hộ
    │   ├── audit.routes.js       # Tuyến đường xem audit logs (Admin)
    │   ├── auth.routes.js        # Tuyến đường đăng nhập & tự đổi mật khẩu
    │   ├── employee.routes.js    # Tuyến đường quản lý nhân sự (Admin)
    │   ├── event.routes.js       # Tuyến đường cài đặt sự kiện (Manager)
    │   ├── group.routes.js       # Tuyến đường quản lý nhóm ghế (Manager)
    │   ├── index.js              # Điểm gom và ánh xạ /api/*
    │   ├── maintenance.routes.js # Tuyến đường sao lưu & phục hồi (Admin)
    │   ├── org.routes.js         # Tuyến đường tổ chức Khối / Phòng (Admin)
    │   └── seat.routes.js        # Tuyến đường sơ đồ 200 ghế (Manager)
    ├── scripts/          # Công cụ dòng lệnh bảo trì máy chủ
    │   └── resetAdmin.js     # Đặt lại mật khẩu Admin: `npm run reset-admin <mật_khẩu_mới>`
    ├── seed/             # Dữ liệu khởi tạo và khôi phục hệ thống ban đầu
    │   ├── seedData.js       # Cấu trúc mẫu ban đầu (khối, phòng, nhân sự, 200 ghế)
    │   └── seed.js           # Kịch bản nạp: `npm run seed` (an toàn) và `npm run seed:force`
    └── utils/            # Các tiện ích bổ trợ
        ├── archive.js        # Đóng gói và lưu trữ dữ liệu sự kiện cũ
        ├── audit.js          # Tiện ích ghi vết kiểm toán hệ thống
        └── token.js          # Bộ sinh mã token 6 ký tự bảo mật dán trên tem ghế
```

---

## MỤC 2: BẢNG DANH MỤC API ROUTES & PHÂN QUYỀN

| Nhóm API | Tuyến đường Endpoint | Phương thức | Quyền truy cập | Mô tả chức năng |
|---|---|:---:|:---:|---|
| **Xác thực (Auth)** | `/api/auth/staff/login` | `POST` | Công khai (Limiter) | Đăng nhập Admin / Manager (cấp JWT Token) |
| | `/api/auth/change-password` | `POST` | Đã đăng nhập | Tự đổi mật khẩu (yêu cầu mật khẩu cũ + mới >= 8 ký tự) |
| | `/api/auth/attendee/lookup` | `POST` | Công khai (Limiter) | Tra cứu đại biểu tham dự theo mã nhân sự |
| | `/api/auth/attendee/guest` | `POST` | Công khai | Tiếp đón đăng ký đại biểu khách mời tự do |
| | `/api/auth/me` | `GET` | Đã đăng nhập | Lấy thông tin tài khoản hiện tại từ JWT |
| **Cơ cấu tổ chức (Org)** | `/api/org/blocks` | `GET` | Mọi Role | Danh sách Khối cơ quan |
| | `/api/org/blocks` | `POST` | `ADMIN` | Thêm mới Khối cơ quan |
| | `/api/org/blocks/:id` | `PUT` / `DELETE`| `ADMIN` | Sửa / Xóa Khối cơ quan |
| | `/api/org/departments` | `GET` | Mọi Role | Danh sách Phòng ban / Phân xưởng |
| | `/api/org/departments` | `POST` | `ADMIN` | Thêm mới Phòng ban |
| | `/api/org/departments/:id` | `PUT` / `DELETE` | `ADMIN` | Sửa / Xóa Phòng ban |
| **Nhân sự (Employee)** | `/api/employees` | `GET` | `ADMIN`, `MANAGER` | Tra cứu, tìm kiếm, lọc danh sách nhân sự |
| | `/api/employees` | `POST` | `ADMIN` | Thêm mới hồ sơ nhân sự |
| | `/api/employees/:code` | `PUT` / `DELETE`| `ADMIN` | Cập nhật hồ sơ / Đặt lại mật khẩu cán bộ / Xóa nhân sự |
| | `/api/employees/import` | `POST` | `ADMIN` | Nhập danh sách nhân sự hàng loạt từ file Excel |
| **Nhóm ghế (Group)** | `/api/groups` | `GET` | Mọi Role | Lấy danh mục các nhóm ghế và màu sắc |
| | `/api/groups` | `POST` | `MANAGER` | Tạo nhóm ghế (hỗ trợ liên kết khối) |
| | `/api/groups/:id` | `PUT` / `DELETE` | `MANAGER` | Cập nhật / Xóa nhóm ghế hội trường |
| | `/api/groups/:id/usage` | `GET` | `MANAGER` | Kiểm tra số lượng ghế và nhân sự đang gắn vào nhóm |
| **Sơ đồ ghế (Seat)** | `/api/seats` | `GET` | Mọi Role | Lấy trạng thái phân bổ của 200 ghế hội trường |
| | `/api/seats/assign-seats` | `POST` | `MANAGER` | Gán hoặc hủy gán nhóm cho danh sách ghế đơn lẻ |
| | `/api/seats/assign-rows` | `POST` | `MANAGER` | Gán nhanh nhóm ghế cho toàn bộ một hàng ghế (20 ghế) |
| | `/api/seats/reset` | `POST` | `MANAGER` | Đặt lại toàn bộ 200 ghế về trạng thái chưa gán |
| **Sự kiện (Event)** | `/api/event` | `GET` | Mọi Role | Lấy cấu hình sự kiện, tên hội nghị, trạng thái mở điểm danh |
| | `/api/event` | `PUT` | `MANAGER` | Cập nhật tên sự kiện, URL ứng dụng, bật/tắt đón khách |
| | `/api/event/tokens/rotate` | `POST` | `MANAGER` | Đổi mới token bảo mật tem dán ghế chống gian lận |
| **Điểm danh (Attendance)** | `/api/attendance` | `GET` | Mọi Role | Xem danh sách đại biểu đã điểm danh (lọc theo quyền) |
| | `/api/attendance/checkin` | `POST` | `EMPLOYEE` | Quét mã QR hoặc gõ mã tem dán ghế kèm xác thực token |
| | `/api/attendance/manual-checkin` | `POST` | `ADMIN`, `MANAGER` | Điểm danh hộ cho đại biểu quên máy (ghi nhận vết audit) |
| | `/api/attendance/reset` | `POST` | `ADMIN`, `MANAGER` | Lưu trữ và xóa danh sách điểm danh cho sự kiện mới |
| **Kiểm toán & Bảo trì** | `/api/audit` | `GET` | `ADMIN` | Xem danh sách nhật ký thao tác hệ thống |
| | `/api/maintenance/backup` | `GET` | `ADMIN` | Xuất file dữ liệu JSON sao lưu toàn bộ hệ thống |
| | `/api/maintenance/restore`| `POST` | `ADMIN` | Phục hồi dữ liệu hệ thống từ file sao lưu JSON |

---

## MỤC 3: QUẢN LÝ BẢO MẬT & MẬT KHẨU KHỞI TẠO

1. **Khởi tạo dữ liệu (Seed)**:
   - Dữ liệu ban đầu được nạp an toàn bằng lệnh `npm run seed` (không ghi đè nếu DB đã có dữ liệu).
   - Mật khẩu khởi tạo được lấy từ biến môi trường `SEED_ADMIN_PASSWORD` và `SEED_MANAGER_PASSWORD` tại file `.env` phía máy chủ, không hiển thị trong tài liệu hoặc mã nguồn công khai.
2. **Quy tắc mật khẩu**:
   - Tối thiểu 8 ký tự.
   - Băm một chiều bằng thư viện `bcryptjs`.
3. **Cơ chế khôi phục Quản trị viên khẩn cấp**:
   - Khi vận hành máy chủ Intranet không có dịch vụ SMTP gửi email ra ngoài, người quản trị hạ tầng có thể đặt lại mật khẩu Admin trực tiếp qua Terminal:
     ```bash
     node src/scripts/resetAdmin.js <MậtKhẩuMới>
     # hoặc: npm run reset-admin <MậtKhẩuMới>
     ```
   - Thao tác này ghi đè hash mới vào tài khoản Admin ngay lập tức mà không làm ảnh hưởng đến các dữ liệu hội trường khác.
