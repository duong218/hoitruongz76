# BÁO CÁO CẤU TRÚC VÀ TÍCH HỢP MERN STACK HOÀN CHỈNH

Hệ thống đã được thiết lập để **Frontend (ReactJS Vite) và Backend (Node.js/Express + MongoDB) chạy cùng nhau đồng bộ và an toàn**.

---

## 1. Kiến trúc hệ sinh thái MERN

```text
hoitruongz76-main/
├── package.json              # Script điều khiển chạy cả client & server
├── .gitignore
├── client/                   # FRONTEND (React 18/19, Tailwind CSS v4, Vite)
│   ├── src/
│   │   ├── services/         # Toàn bộ đã chuyển sang gọi API Backend qua axios
│   │   │   ├── api.js        # Axios instance kèm JWT Interceptor, timeout 20s
│   │   │   ├── attendeeService.js
│   │   │   ├── staffAuthService.js # Đăng nhập & tự đổi mật khẩu Staff
│   │   │   ├── employeeService.js
│   │   │   ├── orgService.js
│   │   │   ├── groupService.js
│   │   │   ├── seatService.js
│   │   │   ├── eventService.js
│   │   │   └── attendanceService.js
│   └── vite.config.js        # Cấu hình Proxy /api -> http://localhost:5000
│
└── server/                   # BACKEND (Node.js, Express, MongoDB Mongoose)
    ├── server.js             # Khởi chạy Express Server
    ├── .env                  # Cấu hình PORT=5000, MONGO_URI, JWT_SECRET, mật khẩu seed
    └── src/
        ├── app.js            # Khai báo middleware (cors, helmet, rate-limit) và routes
        ├── config/           # Kết nối MongoDB (db.js) và biến môi trường (env.js)
        ├── models/           # Mongoose Models (Employee, Block, Department, Group, Seat, EventSetting, Attendance, Audit)
        ├── middleware/       # JWT Auth & phân quyền Roles (auth.js), xử lý lỗi (errorHandler.js)
        ├── routes/           # RESTful API Endpoints (/api/auth, /api/employees, /api/org, /api/groups, /api/seats, /api/event, /api/attendance)
        ├── scripts/          # Lệnh CLI đặt lại mật khẩu Admin (resetAdmin.js)
        └── seed/             # Nạp dữ liệu cấu trúc ban đầu vào MongoDB
```

---

## 2. Các API Endpoints hoàn chỉnh

| Nhóm | Phương thức & URL | Mục đích | Quyền hạn |
|---|---|---|---|
| **Auth** | `POST /api/auth/staff/login` | Đăng nhập Admin / Manager, cấp JWT Token | Công khai (Rate-limit) |
| | `POST /api/auth/change-password` | Tự đổi mật khẩu tài khoản đang đăng nhập | Admin, Manager |
| | `POST /api/auth/attendee/lookup` | Tra cứu mã đại biểu/nhân viên, cấp quyền theo khối | Công khai (Rate-limit) |
| | `POST /api/auth/attendee/guest` | Đăng ký & vào phiên khách mời | Công khai |
| | `GET /api/auth/me` | Lấy thông tin phiên hiện tại | Đã xác thực |
| **Employees** | `GET /api/employees` | Lấy danh sách nhân viên | Admin, Manager |
| | `POST /api/employees` | Thêm nhân sự mới | Admin |
| | `PUT /api/employees/:code` | Cập nhật thông tin nhân viên / đặt lại mật khẩu | Admin |
| | `DELETE /api/employees/:code` | Xóa nhân viên | Admin |
| | `POST /api/employees/import` | Nhập danh sách nhân viên hàng loạt từ Excel | Admin |
| **Cơ cấu tổ chức** | `GET /api/org/blocks` | Danh sách các Khối | Mọi quyền |
| | `POST /api/org/blocks` | Thêm Khối (ràng buộc toàn vẹn) | Admin |
| | `GET /api/org/departments` | Danh sách các Phòng ban | Mọi quyền |
| | `POST /api/org/departments` | Thêm Phòng ban | Admin |
| **Nhóm ghế** | `GET /api/groups` | Danh sách nhóm hội trường | Mọi quyền |
| | `GET /api/groups/:id/usage` | Thống kê số người & số ghế của nhóm | Manager |
| | `POST /api/groups` | Tạo nhóm hội trường mới | Manager |
| **Sơ đồ ghế** | `GET /api/seats` | Sơ đồ 200 ghế hội trường | Mọi quyền |
| | `POST /api/seats/assign-seats` | Gán nhóm cho từng ghế | Manager |
| | `POST /api/seats/assign-rows` | Gán nhóm cho cả hàng ghế | Manager |
| **Sự kiện & QR** | `GET /api/event` | Cài đặt sự kiện & mã bảo mật ghế ngồi (token) | Mọi quyền |
| | `PUT /api/event` | Cập nhật cấu hình sự kiện, bật/tắt điểm danh | Manager |
| **Điểm danh** | `GET /api/attendance` | Lấy danh sách đại biểu đã điểm danh | Nhân viên (xem bản thân), Staff (toàn bộ) |
| | `POST /api/attendance/checkin` | Quét QR hoặc gõ mã tem với cơ chế chống gian lận | Nhân viên |
| | `POST /api/attendance/manual-checkin` | Điểm danh hộ có ghi vết kiểm toán | Admin, Manager |
| | `POST /api/attendance/reset` | Đặt lại danh sách điểm danh | Admin, Manager |

---

## 3. Quản lý Mật khẩu & Bảo mật Vận hành

1. **Khởi tạo dữ liệu ban đầu**:
   - Mật khẩu khởi tạo được nạp qua các biến môi trường cấu hình tại `server/.env`:
     - `SEED_ADMIN_PASSWORD`: Mật khẩu tài khoản `ADMIN`
     - `SEED_MANAGER_PASSWORD`: Mật khẩu tài khoản `QL01`
   - Tuyệt đối không để lộ mật khẩu trong code hay tài liệu public.
2. **Tự phục vụ đổi mật khẩu**:
   - Cán bộ quản lý hoặc quản trị viên bấm nút **"Đổi MK"** ở thanh Header để đổi mật khẩu cá nhân.
3. **Cơ chế khôi phục khi quên mật khẩu Admin**:
   - Khi vận hành Intranet không có email ngoài, khôi phục bằng lệnh CLI tại thư mục `server`:
     ```bash
     npm run reset-admin <mật_khẩu_mới>
     ```

---

## 4. Cách chạy hệ thống đồng thời

### Bước 1: Khởi động MongoDB
Đảm bảo dịch vụ MongoDB đang chạy (mặc định tại `mongodb://127.0.0.1:27017`).

### Bước 2: Nạp dữ liệu khởi tạo (Chạy lần đầu)
Mở terminal tại thư mục gốc:
```bash
npm run seed:server
```
*(Chỉ nạp khi cơ sở dữ liệu còn trống. Nếu muốn làm mới toàn bộ: `npm run seed:force`)*

### Bước 3: Chạy song song Server và Client
Có thể mở **2 cửa sổ Terminal**:

- **Terminal 1 (Backend Express):**
  ```bash
  npm run dev:server
  ```
  *(Server lắng nghe tại `http://localhost:5000`)*

- **Terminal 2 (Frontend React Vite):**
  ```bash
  npm run dev:client
  ```
  *(Truy cập ứng dụng tại `http://localhost:3000`)*
