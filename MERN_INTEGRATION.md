# BÁO CÁO CẤU TRÚC VÀ TÍCH HỢP MERN STACK HOÀN CHỈNH

Hệ thống đã được thiết lập để **Frontend (ReactJS Vite) và Backend (Node.js/Express + MongoDB) chạy cùng nhau đồng bộ**.

---

## 1. Kiến trúc hệ sinh thái MERN

```text
hoitruongz76-main/
├── package.json              # Script điều khiển chạy cả client & server
├── .gitignore
├── client/                   # FRONTEND (React 19, Tailwind CSS, Vite)
│   ├── src/
│   │   ├── services/         # Toàn bộ đã chuyển sang gọi API Backend qua axios
│   │   │   ├── api.js        # Axios instance kèm JWT Interceptor
│   │   │   ├── attendeeService.js
│   │   │   ├── staffAuthService.js
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
    ├── .env                  # Cấu hình PORT=5000, MONGO_URI, JWT_SECRET
    └── src/
        ├── app.js            # Khai báo middleware (cors, helmet, cookie) và routes
        ├── config/           # Kết nối MongoDB (db.js) và biến môi trường (env.js)
        ├── models/           # Mongoose Models (Employee, Block, Department, Group, Seat, EventSetting, Attendance)
        ├── middleware/       # JWT Auth & phân quyền Roles (auth.js), xử lý lỗi (errorHandler.js)
        ├── routes/           # RESTful API Endpoints (/api/auth, /api/employees, /api/org, /api/groups, /api/seats, /api/event, /api/attendance)
        └── seed/             # Nạp dữ liệu mẫu ban đầu vào MongoDB
```

---

## 2. Các API Endpoints đã hoàn thành

| Nhóm | Phương thức & URL | Mục đích |
|---|---|---|
| **Auth** | `POST /api/auth/staff/login` | Đăng nhập Admin / Manager, cấp JWT Token |
| | `POST /api/auth/attendee/lookup` | Tra cứu mã đại biểu/nhân viên, cấp quyền theo khối |
| | `POST /api/auth/attendee/guest` | Đăng ký & vào phiên khách mời |
| **Employees** | `GET /api/employees` | Lấy danh sách nhân viên |
| | `POST /api/employees` | Thêm nhân sự mới (Admin) |
| | `PUT /api/employees/:code` | Cập nhật thông tin nhân viên / mật khẩu staff (Admin) |
| | `DELETE /api/employees/:code` | Xóa nhân viên (Admin) |
| | `POST /api/employees/import` | Nhập danh sách nhân viên hàng loạt từ Excel (Admin) |
| **Cơ cấu tổ chức** | `GET /api/org/blocks` | Danh sách các Khối |
| | `POST /api/org/blocks` | Thêm Khối (ràng buộc toàn vẹn) |
| | `GET /api/org/departments` | Danh sách các Phòng ban |
| | `POST /api/org/departments` | Thêm Phòng ban |
| **Nhóm ghế** | `GET /api/groups` | Danh sách nhóm hội trường |
| | `GET /api/groups/:id/usage` | Thống kê số người & số ghế của nhóm |
| | `POST /api/groups` | Tạo nhóm hội trường mới |
| **Sơ đồ ghế** | `GET /api/seats` | Sơ đồ 200 ghế hội trường |
| | `POST /api/seats/assign-seats` | Gán nhóm cho từng ghế |
| | `POST /api/seats/assign-rows` | Gán nhóm cho hàng ghế |
| **Sự kiện & QR** | `GET /api/event` | Cài đặt sự kiện & mã bảo mật ghế ngồi (token) |
| | `PUT /api/event` | Cập nhật cấu hình sự kiện, bật/tắt điểm danh |
| **Điểm danh** | `GET /api/attendance` | Lấy danh sách đại biểu đã điểm danh |
| | `POST /api/attendance/checkin` | Quét QR điểm danh với ràng buộc chống gian lận |
| | `POST /api/attendance/reset` | Đặt lại danh sách điểm danh |

---

## 3. Cách chạy hệ thống đồng thời

### Bước 1: Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên máy (mặc định tại `mongodb://127.0.0.1:27017`).

### Bước 2: Nạp dữ liệu mẫu vào Database (Chạy lần đầu)
Mở terminal tại thư mục gốc của dự án:
```bash
npm run seed:server
```
*(Nếu muốn xóa sạch database nạp lại: `npm run seed:force`)*

### Bước 3: Chạy đồng thời Server và Client
Bạn có thể mở **2 cửa sổ Terminal**:

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

