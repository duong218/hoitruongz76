# BÁO CÁO CẤU TRÚC BACKEND SERVER & TIÊU CHUẨN KIẾN TRÚC MERN (NODE.JS + EXPRESS + MONGODB)

Tài liệu mô tả chi tiết kiến trúc, cấu trúc thư mục, danh mục API routes, data models và luồng hoạt động của tầng Backend (`server/`) thuộc hệ thống Hội trường Z176.

> **Tổng quan hệ thống Backend**:
> - Nền tảng: **Node.js (>=20)** với **ES Module (`"type": "module"`)**.
> - Framework Web: **Express 5.x**.
> - Cơ sở dữ liệu: **MongoDB** tương tác qua **Mongoose 9.x**.
> - Bảo mật & Xác thực: **JWT (JSON Web Token)**, **bcryptjs** (băm mật khẩu), **Helmet** (HTTP headers), **CORS**, **Cookie Parser**.
> - Đã rà soát và loại bỏ file thừa, đảm bảo phân định quyền chuẩn (Admin / Manager) và đồng bộ trọn vẹn với các nâng cấp phía Client.

---

## MỤC 1: CÂY THƯ MỤC BACKEND SERVER (TREE)
*(Đã loại trừ `node_modules`, file rác)*

```text
server/
├── .env                  # Biến môi trường (PORT, MONGO_URI, JWT_SECRET, CLIENT_ORIGIN,...)
├── package.json          # Danh sách thư viện và kịch bản (dev, start, seed, seed:force)
├── server.js             # Entry point khởi động ứng dụng và kết nối MongoDB
└── src/
    ├── app.js            # Khởi tạo Express, cấu hình middleware tập trung và gắn routes
    ├── config/           # Cấu hình môi trường & cơ sở dữ liệu
    │   ├── db.js         # Kết nối và ngắt kết nối Mongoose / MongoDB
    │   └── env.js        # Đọc và kiểm tra tính hợp lệ của biến môi trường (.env)
    ├── constants/        # Các hằng số nghiệp vụ dùng cho server
    │   ├── hall.server.js    # Cấu hình kích thước hội trường 200 ghế, regex mã ghế (seatId)
    │   └── roles.server.js   # Danh mục quyền: ADMIN, MANAGER, EMPLOYEE, GUEST
    ├── controllers/      # Bộ xử lý nghiệp vụ chính (Controller Layer)
    │   ├── attendance.controller.js  # Điểm danh, tra cứu lịch sử, đặt lại điểm danh
    │   ├── auth.controller.js        # Đăng nhập Staff, tra cứu đại biểu, tạo khách mời
    │   ├── employee.controller.js    # CRUD nhân sự, phân quyền, import danh sách
    │   ├── event.controller.js       # Cài đặt sự kiện, token ghế, cấu hình điểm danh
    │   ├── group.controller.js       # CRUD nhóm ghế hội trường, kiểm tra ràng buộc khối
    │   ├── org.controller.js         # CRUD Khối (Blocks) & Phòng ban (Departments)
    │   └── seat.controller.js        # Quản lý 200 ghế, gán nhóm ghế lẻ, gán theo hàng
    ├── middleware/       # Các Middleware xác thực, ủy quyền và xử lý lỗi
    │   ├── auth.js           # authenticate (xác thực JWT) & authorize (kiểm tra Role)
    │   └── errorHandler.js   # Bắt lỗi tập trung (errorHandler) & 404 (notFound)
    ├── models/           # Định nghĩa cấu trúc Schema MongoDB (Mongoose ODM)
    │   ├── _clean.js         # Hàm tiện ích làm sạch JSON (bỏ _id, __v, thông tin nhạy cảm)
    │   ├── Attendance.js     # Bản ghi điểm danh (employeeCode, seatId, checkedInAt)
    │   ├── Block.js          # Khối cơ quan (id, name)
    │   ├── Department.js     # Phòng ban trực thuộc khối (id, name, blockId)
    │   ├── Employee.js       # Nhân sự (code, name, role, departmentId, blockId, passwordHash)
    │   ├── EventSetting.js   # Cài đặt hội nghị (eventName, guestEnabled, checkInOpen, appUrl)
    │   ├── Group.js          # Nhóm ghế (id, name, color, checkInRequired, blockIds)
    │   ├── index.js          # Điểm xuất tập trung các Models
    │   └── Seat.js           # 200 ghế ngồi (seatId, groupId, token bảo mật dán trên ghế)
    ├── seed/             # Dữ liệu khởi tạo và khôi phục hệ thống
    │   ├── seedData.js       # Kịch bản nạp dữ liệu mẫu ban đầu (khối, phòng, nhân sự, 200 ghế)
    │   └── runSeed.js        # File thực thi seed từ dòng lệnh: `npm run seed`
    └── routes/           # Định nghĩa Endpoint và gắn Middleware phân quyền
        ├── attendance.routes.js  # Tuyến đường điểm danh
        ├── auth.routes.js        # Tuyến đường đăng nhập & xác thực
        ├── employee.routes.js    # Tuyến đường quản lý nhân sự (Admin)
        ├── event.routes.js       # Tuyến đường cài đặt sự kiện (Manager)
        ├── group.routes.js       # Tuyến đường quản lý nhóm ghế (Manager)
        ├── index.js              # Điểm gom và ánh xạ /api/*
        ├── org.routes.js         # Tuyến đường tổ chức Khối / Phòng (Admin)
        └── seat.routes.js        # Tuyến đường sơ đồ 200 ghế (Manager)
```

---

## MỤC 2: BẢNG DANH MỤC API ROUTES & PHÂN QUYỀN

| Nhóm API | Tuyến đường Endpoint | Phương thức | Quyền truy cập | Mô tả chức năng |
|---|---|:---:|:---:|---|
| **Xác thực (Auth)** | `/api/auth/staff-login` | `POST` | Công khai | Đăng nhập Admin / Manager (trả JWT qua Cookie hoặc Body) |
| | `/api/auth/attendee` | `POST` | Công khai | Tra cứu thông tin đại biểu tham dự theo mã nhân sự |
| | `/api/auth/guest` | `POST` | Công khai | Tiếp đón đăng ký đại biểu khách mời tự do |
| | `/api/auth/me` | `GET` | Đã đăng nhập | Lấy thông tin tài khoản hiện tại từ JWT |
| | `/api/auth/logout` | `POST` | Đã đăng nhập | Xóa phiên đăng nhập |
| **Cơ cấu tổ chức (Org)** | `/api/org/blocks` | `GET` | Mọi Role | Danh sách Khối cơ quan |
| | `/api/org/blocks` | `POST` | `ADMIN` | Thêm mới Khối cơ quan |
| | `/api/org/blocks/:id` | `PUT` / `DELETE`| `ADMIN` | Sửa / Xóa Khối cơ quan |
| | `/api/org/departments` | `GET` | Mọi Role | Danh sách Phòng ban / Phân xưởng |
| | `/api/org/departments` | `POST` | `ADMIN` | Thêm mới Phòng ban |
| | `/api/org/departments/:id` | `PUT` / `DELETE` | `ADMIN` | Sửa / Xóa Phòng ban |
| **Nhân sự (Employee)** | `/api/employees` | `GET` | `ADMIN`, `MANAGER` | Tra cứu, tìm kiếm, lọc danh sách nhân sự |
| | `/api/employees` | `POST` | `ADMIN` | Thêm mới hồ sơ nhân sự |
| | `/api/employees/:code` | `PUT` / `DELETE`| `ADMIN` | Cập nhật hồ sơ / Xóa nhân sự |
| | `/api/employees/import` | `POST` | `ADMIN` | Nhập danh sách nhân sự hàng loạt từ file Excel |
| **Nhóm ghế (Group)** | `/api/groups` | `GET` | Mọi Role | Lấy danh mục các nhóm ghế và màu sắc |
| | `/api/groups` | `POST` | `MANAGER` | Tạo nhóm ghế (hỗ trợ liên kết khối) |
| | `/api/groups/:id` | `PUT` / `DELETE` | `MANAGER` | Cập nhật / Xóa nhóm ghế hội trường |
| | `/api/groups/:id/usage` | `GET` | `MANAGER` | Kiểm tra số lượng ghế và nhân sự đang gắn vào nhóm |
| **Sơ đồ ghế (Seat)** | `/api/seats` | `GET` | Mọi Role | Lấy trạng thái phân bổ của 200 ghế hội trường |
| | `/api/seats/assign` | `POST` | `MANAGER` | Gán hoặc hủy gán nhóm cho danh sách ghế đơn lẻ |
| | `/api/seats/assign-row` | `POST` | `MANAGER` | Gán nhanh nhóm ghế cho toàn bộ một hàng ghế (20 ghế) |
| | `/api/seats/reset` | `POST` | `MANAGER` | Đặt lại toàn bộ 200 ghế về trạng thái chưa gán |
| **Sự kiện (Event)** | `/api/event` | `GET` | Mọi Role | Lấy cấu hình sự kiện, tên hội nghị, trạng thái mở điểm danh |
| | `/api/event` | `PUT` | `MANAGER` | Cập nhật tên sự kiện, URL ứng dụng, bật/tắt đón khách |
| | `/api/event/tokens/rotate` | `POST` | `MANAGER` | Đổi mới token bảo mật tem dán ghế chống gian lận |
| **Điểm danh (Attendance)** | `/api/attendance` | `GET` | `MANAGER` | Xem danh sách đại biểu đã điểm danh theo thời gian thực |
| | `/api/attendance/checkin` | `POST` | Công khai / Đại biểu | Quét mã QR điểm danh ghế ngồi kèm xác thực token |
| | `/api/attendance/reset` | `POST` | `MANAGER` | Xóa dữ liệu điểm danh để chuẩn bị cho phiên họp mới |

---

## MỤC 3: CHI TIẾT CÁC SCHEMA MONGOOSE (MODELS)

1. **`Block` (`server/src/models/Block.js`)**:
   - `id`: String (bắt buộc, duy nhất, ví dụ: `block-agency`).
   - `name`: String (bắt buộc, tên khối, collation không phân biệt hoa thường).

2. **`Department` (`server/src/models/Department.js`)**:
   - `id`: String (bắt buộc, duy nhất).
   - `name`: String (bắt buộc, tên phòng ban / phân xưởng).
   - `blockId`: String (bắt buộc, tham chiếu tới `Block.id`).

3. **`Employee` (`server/src/models/Employee.js`)**:
   - `code`: String (bắt buộc, mã định danh nhân sự duy nhất, đánh index).
   - `name`: String (bắt buộc, họ tên nhân viên).
   - `role`: String (enum: `ADMIN`, `MANAGER`, `EMPLOYEE`, `GUEST`).
   - `departmentId`: String (tham chiếu tới phòng ban).
   - `blockId`: String (tham chiếu tới khối).
   - `passwordHash`: String (mã băm bcrypt, chỉ dùng cho tài khoản quản trị).

4. **`Group` (`server/src/models/Group.js`)**:
   - `id`: String (bắt buộc, duy nhất, ví dụ: `group-agency`).
   - `name`: String (bắt buộc, tên nhóm ghế).
   - `color`: String (bắt buộc, mã màu hex ví dụ: `#0284C7`, tương thích 18 màu sắc chuẩn).
   - `isSystem`: Boolean (true đối với nhóm Khách mời cố định).
   - `checkInRequired`: Boolean (yêu cầu quét QR tại ghế hay miễn quét).
   - `blockIds`: Array of String (danh sách `Block.id` trực thuộc nhóm ghế này).

5. **`Seat` (`server/src/models/Seat.js`)**:
   - `seatId`: String (bắt buộc, regex kiểm tra chuẩn: `{row}-{side}-{n}`, ví dụ `1-L-1` đến `10-R-10`).
   - `groupId`: String (null hoặc tham chiếu tới `Group.id`).
   - `token`: String (chuỗi bí mật ngẫu nhiên dán trên tem QR ghế chống quét trước).

6. **`EventSetting` (`server/src/models/EventSetting.js`)**:
   - `eventName`: String (tên hội nghị, phiên đại hội).
   - `guestEnabled`: Boolean (cho phép khách mời ngoài danh sách).
   - `checkInOpen`: Boolean (mở/đóng cổng điểm danh).
   - `appUrl`: String (đường dẫn ứng dụng hiển thị trên mã QR dán cửa).

7. **`Attendance` (`server/src/models/Attendance.js`)**:
   - `employeeCode`: String (bắt buộc, mã nhân viên điểm danh).
   - `seatId`: String (bắt buộc, mã vị trí ghế ngồi).
   - `checkedInAt`: Date (thời điểm ghi nhận điểm danh, mặc định `Date.now`).
