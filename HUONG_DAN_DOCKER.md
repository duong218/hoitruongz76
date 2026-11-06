# Chạy hệ thống Z176 bằng Docker

Cần: **Docker Desktop** (Windows hoặc Mac), tải ở docker.com, cài xong mở lên chờ biểu tượng cá voi báo "running".

## Cài lần đầu
1. Giải nén dự án, mở terminal trong thư mục có file `docker-compose.yml`.
2. Sao chép `.env.example` thành `.env`, mở ra điền:
   - `PUBLIC_URL`: địa chỉ máy chạy, ví dụ `http://192.168.1.10` (xem IP bằng `ipconfig` trên Windows, `ifconfig` trên Mac).
   - `JWT_SECRET`: chuỗi dài ngẫu nhiên.
   - Hai mật khẩu seed (tối thiểu 8 ký tự).
3. Chạy: `docker compose up -d --build` (lần đầu mất vài phút).
4. Nạp dữ liệu mẫu (chỉ lần đầu): `docker compose exec server npm run seed`
5. Mở trình duyệt vào địa chỉ ở `PUBLIC_URL`.

Máy khác trong cùng mạng truy cập bằng đúng địa chỉ đó. Nếu không vào được: mở cổng 80 trong tường lửa của máy chủ.

## Hằng ngày
- Dừng: `docker compose stop`   Chạy lại: `docker compose start`
- Cập nhật code mới: `docker compose up -d --build`
- Xem lỗi: `docker compose logs -f server`
- Dữ liệu nằm trong ổ lưu trữ của Docker, không mất khi dừng hay cập nhật. **Không** chạy `docker compose down -v` (lệnh này xóa dữ liệu).

## Khi chuyển sang tên miền hoitruong.z76.vn
1. Trỏ bản ghi DNS A của `hoitruong.z76.vn` về IP công khai của máy chủ, mở cổng 80 và 443 trên router.
2. Trong `.env` đổi `PUBLIC_URL=https://hoitruong.z76.vn` và `SITE_ADDRESS=hoitruong.z76.vn`.
3. Chạy `docker compose up -d`. Caddy tự cấp HTTPS.
