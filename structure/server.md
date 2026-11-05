# BÁO CÁO CẤU TRÚC BACKEND SERVER & TIÊU CHUẨN KIẾN TRÚC MERN (NODE.JS + EXPRESS + MONGODB)

Tài liệu mô tả chi tiết kiến trúc, cấu trúc thư mục, danh mục API routes, data models và luồng hoạt động của tầng Backend (`server/`) thuộc hệ thống Hội trường Z176.

> **Tổng quan hệ thống Backend**:
> - Nền tảng: **Node.js (>=20)** với **ES Module (`"type": "module"`)**.
> - Framework Web: **Express 5.x**.
> - Cơ sở dữ liệu: **MongoDB** tương tác qua **Mongoose 9.x**.
> - Bảo mật & Xác thực: **JWT (JSON Web Token)**, **bcryptjs** (băm mật khẩu), **Helmet** (HTTP headers), **CORS**, **Cookie Parser**.

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
    │   ├── group.controller.js       # CRUD nhóm ghế hội trường, thống kê số ghế/nhân sự
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
    │   ├── seed.js           # Kịch bản nạp dữ liệu mẫu an toàn (npm run seed / seed:force)
    │   └── seedData.js       # Bộ dữ liệu mẫu chuẩn của Nhà máy Z176
    └── utils/            # Tiện ích máy chủ
        └── seatToken.js      # Bộ sinh mã token ngẫu nhiên bảo mật cao cho tem QR từng ghế
```

---

## MỤC 2: KIẾN TRÚC MÔ HÌNH VÀ CƠ SỞ DỮ LIỆU (DATABASE MODELS)

Hệ thống được chuẩn hóa trên MongoDB gồm 7 Collection chính:

1. **`Employee` (`src/models/Employee.js`)**:
   - Quản lý danh sách nhân sự toàn nhà máy, bao gồm nhân viên tham dự và các tài khoản quản trị/quản lý.
   - Trường: `code` (Mã định danh duy nhất, in hoa), `name`, `role` (`ADMIN`, `MANAGER`, `EMPLOYEE`, `GUEST`), `departmentId`, `blockId`, `passwordHash` (Mật khẩu mã hóa bcrypt, `select: false` để bảo mật tuyệt đối).

2. **`Block` (`src/models/Block.js`) & `Department` (`src/models/Department.js`)**:
   - Quản lý cơ cấu tổ chức phân tầng: Khối cơ quan $\rightarrow$ Phòng ban trực thuộc.
   - Nhân viên được gắn theo Khối để tự động xác định nhóm ghế trong hội trường.

3. **`Group` (`src/models/Group.js`)**:
   - Định nghĩa nhóm đại biểu trong hội trường (tên nhóm, màu sắc đại diện trên sơ đồ SVG, danh sách `blockIds` liên kết, cờ `checkInRequired`).
   - Có nhóm hệ thống cố định dành cho `Khách mời` (`isSystem: true`).

4. **`Seat` (`src/models/Seat.js`)**:
   - Chứa đủ **200 vị trí ghế** tương ứng sơ đồ thực tế (10 hàng $\times$ 20 ghế).
   - Mỗi ghế có `seatId` chuẩn (ví dụ `3-L-1`: Hàng 3, Bên trái, Ghế số 1), `groupId` (nhóm được phân bổ) và một chuỗi `token` bảo mật ngẫu nhiên không trùng lặp dùng để in mã QR tem dán cố định.

5. **`EventSetting` (`src/models/EventSetting.js`)**:
   - Quản lý trạng thái phiên hội nghị (Key duy nhất `'main'`).
   - Cung cấp: `eventName` (Tên hội nghị), `checkInOpen` (Công tắc mở/đóng cổng điểm danh), `guestEnabled` (Bật/tắt tiếp đón khách ngoài danh sách), `appUrl` (Địa chỉ gốc in tem).

6. **`Attendance` (`src/models/Attendance.js`)**:
   - Lưu trữ nhật ký đại biểu đã điểm danh tại ghế: `employeeCode`, `seatId`, `checkedInAt`.
   - Có ràng buộc `unique: true` trên `employeeCode` nhằm đảm bảo mỗi đại biểu chỉ được xác nhận có mặt một lần trong một sự kiện.

---

## MỤC 3: DANH MỤC API ROUTES & PHÂN QUYỀN (API SPECIFICATION)

Tất cả các API nghiệp vụ đều có tiền tố `/api`:

### 1. Xác thực & Đăng nhập (`/api/auth`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/staff/login` | Public | Đăng nhập tài khoản Admin/Quản lý bằng Mã + Mật khẩu, cấp JWT token (8 giờ) |
| `POST` | `/api/auth/attendee/lookup` | Public | Tra cứu mã nhân viên tham dự, xác thực phân nhóm tự động |
| `POST` | `/api/auth/attendee/guest` | Public | Đăng ký nhanh vào hội trường với tư cách Khách mời |
| `GET` | `/api/auth/me` | Bearer Token | Lấy thông tin phiên đăng nhập hiện tại từ JWT |

### 2. Quản lý Nhân sự (`/api/employees`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Public / Staff | Lấy toàn bộ danh sách nhân sự nhà máy |
| `POST` | `/api/employees` | ADMIN | Thêm nhân sự mới (hỗ trợ cấp mật khẩu cho Staff) |
| `PUT` | `/api/employees/:code` | ADMIN | Cập nhật thông tin nhân sự hoặc đổi mật khẩu quản trị |
| `DELETE`| `/api/employees/:code` | ADMIN | Xóa nhân sự khỏi hệ thống |
| `POST` | `/api/employees/import` | ADMIN | Nhập danh sách nhân sự hàng loạt từ file Excel |

### 3. Cơ cấu Tổ chức (`/api/org`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/org/blocks` | Public / Staff | Danh sách các Khối cơ quan |
| `POST` | `/api/org/blocks` | ADMIN | Thêm Khối mới |
| `PUT` | `/api/org/blocks/:id` | ADMIN | Đổi tên Khối |
| `DELETE`| `/api/org/blocks/:id` | ADMIN | Xóa Khối cơ quan |
| `GET` | `/api/org/departments` | Public / Staff | Danh sách Phòng ban trực thuộc |
| `POST` | `/api/org/departments` | ADMIN | Thêm Phòng ban mới |
| `PUT` | `/api/org/departments/:id` | ADMIN | Sửa Phòng ban |
| `DELETE`| `/api/org/departments/:id` | ADMIN | Xóa Phòng ban |

### 4. Nhóm ghế Hội trường (`/api/groups`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/groups` | Public / Staff | Danh sách nhóm ghế, màu sắc và khối liên kết |
| `GET` | `/api/groups/:id/usage` | Staff | Đếm số lượng nhân sự và số ghế đã gán cho nhóm |
| `POST` | `/api/groups` | ADMIN, MANAGER | Tạo nhóm ghế mới |
| `PUT` | `/api/groups/:id` | ADMIN, MANAGER | Cập nhật tên, màu sắc, khối hoặc yêu cầu điểm danh |
| `DELETE`| `/api/groups/:id` | ADMIN, MANAGER | Xóa nhóm ghế (tự động giải phóng các ghế đã gán) |

### 5. Sơ đồ 200 Ghế ngồi (`/api/seats`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/seats` | Public / Staff | Trả về Map gán ghế: `{"3-L-1": "group-id", ...}` |
| `POST` | `/api/seats/assign-seats` | ADMIN, MANAGER | Gán hoặc bỏ gán nhóm cho danh sách ghế lẻ |
| `POST` | `/api/seats/assign-rows` | ADMIN, MANAGER | Gán hoặc bỏ gán nhóm nhanh cho cả hàng ghế |

### 6. Cài đặt Sự kiện & Mã QR (`/api/event`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/event` | Public / Staff | Lấy thông tin hội nghị, công tắc điểm danh & token ghế |
| `PUT` | `/api/event` | ADMIN, MANAGER | Cập nhật tên hội nghị, đóng/mở điểm danh, link app |

### 7. Điểm danh tại Ghế (`/api/attendance`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | Public / Staff | Danh sách kết quả điểm danh của hội nghị |
| `POST` | `/api/attendance/checkin` | Public | Xác thực quét mã QR tem ghế và ghi nhận có mặt |
| `POST` | `/api/attendance/reset` | ADMIN, MANAGER | Xóa trắng nhật ký điểm danh để đón hội nghị mới |

---

## MỤC 4: BẢO MẬT & LUỒNG XÁC THỰC NGHIỆP VỤ

1. **Bảo vệ phiên Quản trị (Staff Session)**:
   - Sử dụng **JWT (JSON Web Token)** với hạn dùng 8 giờ.
   - Header chuẩn: `Authorization: Bearer <token>`.
   - Middleware `authenticate` kiểm tra token; middleware `authorize(role)` đảm bảo đúng quyền trước khi cho phép can thiệp dữ liệu quản trị.

2. **Quy trình Điểm danh Chống gian lận (Anti-cheat Check-in)**:
   - Khi nhân viên quét mã QR tem ghế, API `/api/attendance/checkin` thực hiện kiểm tra 6 bước chặt chẽ trên Server:
     1. Cổng điểm danh sự kiện đã mở chưa (`checkInOpen === true`).
     2. Nhân sự có tồn tại trên hệ thống và có thuộc diện phải điểm danh không.
     3. Mã ghế có tồn tại trong 200 ghế của hội trường không.
     4. Khóa token gửi lên từ QR có khớp chính xác với token bí mật của chiếc ghế đó trong MongoDB hay không.
     5. Chiếc ghế đó có đang được phân bổ cho Khối/Đơn vị của nhân viên đó không.
     6. Đại biểu này đã điểm danh trước đó chưa (ngăn chặn điểm danh lặp lại).

3. **Cơ chế Mã QR Dán Cố định Vĩnh viễn**:
   - 160 tem QR dán trên ghế (từ hàng 3 đến hàng 10) mang tọa độ vật lý và token tĩnh của từng ghế.
   - Khi chuyển giao giữa các hội nghị, quản lý chỉ cần đổi cấu hình phân bổ ghế trên phần mềm hoặc bấm **"Đặt lại điểm danh"** mà không cần in lại tem QR.

---

## MỤC 5: HƯỚNG DẪN KHỞI CHẠY & NẠP DỮ LIỆU BACKEND

```bash
# 1. Chuyển vào thư mục server
cd server

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Tạo file biến môi trường .env từ mẫu (nếu chưa có)
# Kiểm tra MONGO_URI kết nối tới MongoDB đang chạy (mặc định: mongodb://127.0.0.1:27017/hoitruongz76)

# 4. Khởi tạo dữ liệu mẫu ban đầu (chỉ nạp khi database đang rỗng)
npm run seed

# Hoặc nếu muốn xóa toàn bộ database để nạp lại từ đầu:
npm run seed:force

# 5. Khởi chạy Server chế độ phát triển (Auto reload bằng nodemon)
npm run dev

# 6. Khởi chạy chế độ Production
npm start
```

