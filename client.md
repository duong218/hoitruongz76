# Hướng dẫn cấu trúc MERN Stack (MongoDB, Express, ReactJS, Node.js)

Dự án hiện tại đã được đồng bộ chuẩn **ReactJS (JavaScript / JSX + Vite)** ở thư mục `client/`.

---

## 1. Cấu trúc thư mục đề xuất cho MERN Stack

```text
hoitruongz76-main/
│
├── client/                     # FRONTEND (ReactJS + Tailwind CSS + Vite)
│   ├── src/
│   │   ├── components/         # Các UI component tái sử dụng
│   │   ├── constants/          # Hằng số (roles, hall config...)
│   │   ├── context/            # Context API (Auth, Toast, Confirm)
│   │   ├── data/               # Mock data (dùng dự phòng/fallback)
│   │   ├── hooks/              # Custom hooks
│   │   ├── layouts/            # Layout Admin, Manager, Attendee
│   │   ├── pages/              # Trang theo vai trò (admin, manager, attendee)
│   │   ├── routes/             # Route guards & phân quyền
│   │   ├── services/           # Tầng kết nối API (sử dụng axios qua api.js)
│   │   │   ├── api.js          # Cấu hình Axios instance & interceptors
│   │   │   ├── attendeeService.js
│   │   │   ├── employeeService.js
│   │   │   ├── eventService.js
│   │   │   ├── groupService.js
│   │   │   ├── attendanceService.js
│   │   │   └── staffAuthService.js
│   │   ├── utils/              # Tiện ích helper
│   │   ├── App.jsx             # Router chính
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js          # Cấu hình Vite thuần JS
│   └── package.json
│
├── server/                     # BACKEND (Node.js + Express + MongoDB/Mongoose)
│   ├── config/
│   │   └── db.js               # Kết nối MongoDB (mongoose.connect)
│   ├── controllers/            # Bộ điều hướng logic
│   │   ├── authController.js   # Đăng nhập staff, cấp JWT token
│   │   ├── employeeController.js
│   │   ├── eventController.js
│   │   ├── seatingController.js
│   │   └── attendanceController.js
│   ├── models/                 # Mongoose Schemas & Models
│   │   ├── User.js             # Tài khoản nhân viên/admin
│   │   ├── Group.js            # Nhóm chỗ ngồi/khối/phòng ban
│   │   ├── Seat.js             # Sơ đồ và phân bổ ghế
│   │   ├── Event.js            # Cấu hình sự kiện & token check-in
│   │   └── Attendance.js       # Lịch sử điểm danh
│   ├── middlewares/            # Middleware xác thực (authMiddleware, verifyRole)
│   ├── routes/                 # Express Router (/api/auth, /api/employees, ...)
│   ├── .env                    # Biến môi trường backend (PORT, MONGO_URI, JWT_SECRET)
│   ├── server.js               # Server khởi động Express
│   └── package.json
│
└── README.md
```

---

## 2. Các bước chuyển đổi từ Mock sang API thật

1. **Backend**:
   - Khởi tạo thư mục `server/`, cài đặt `express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`.
   - Viết các endpoints tương ứng:
     - `POST /api/auth/login` (Admin/Manager login với JWT)
     - `POST /api/attendee/lookup` (Tra cứu mã người tham dự)
     - `GET & POST /api/attendance` (Điểm danh & danh sách điểm danh)
     - `GET & PUT /api/seating` (Cấu hình nhóm ghế)
     - `GET & PUT /api/event` (Cấu hình sự kiện)

2. **Frontend (`client/`)**:
   - File cấu hình đã sẵn sàng: [api.js](file:///d:/code%20file/hoitruongz76-main/client/src/services/api.js).
   - Trong các file `client/src/services/*Service.js`, các vị trí cần thay thế bằng `api.get()` / `api.post()` đã được đánh dấu sẵn chú thích `// MERN: ...`.
   - Biến môi trường: tạo `.env` trong `client/` với:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

