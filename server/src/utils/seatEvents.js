import mongoose from 'mongoose';

// Danh sách ghế đã có người điểm danh, giữ trong bộ nhớ và đẩy tới trình duyệt qua SSE
// (Server-Sent Events: 1 kết nối mở sẵn, server tự đẩy tin khi có người quét).
// - Mỗi lượt điểm danh chỉ gửi 1 dòng nhỏ (mã ghế) cho mọi người xem, không ai phải gọi lại server.
// - Mỗi tin có số phiên bản liên tục; trình duyệt thấy bị hụt số thì tải lại bản chụp /occupied một lần.
// - Chỉ chứa mã ghế, không có tên hay mã nhân viên.
// ponytail: dữ liệu nằm trong bộ nhớ tiến trình; chạy nhiều bản server thì cần Redis pub/sub.

const MAX_CLIENTS = 1500; // trần số kết nối đang mở
const HEARTBEAT_MS = 20 * 1000; // tin "ping" giữ kết nối, tránh proxy/Wi-Fi cắt khi im lặng
const MAX_BUFFER = 64 * 1024; // máy nhận quá chậm thì ngắt, không để dồn RAM

const clients = new Set();
let occupied = new Set();
let version = 0;
let ready = false;
let readyPromise = null;
let rebuildTimer = null;

function send(chunk) {
  for (const res of clients) {
    if (res.writableLength > MAX_BUFFER) {
      clients.delete(res);
      res.destroy();
      continue;
    }
    res.write(chunk);
  }
}

const broadcast = (payload) => send(`data: ${JSON.stringify(payload)}\n\n`);

// Nạp lại toàn bộ từ DB (khi khởi động, đặt lại điểm danh, lưu trữ sự kiện, gỡ bản ghi...)
async function rebuild() {
  const ids = await mongoose.model('Attendance').distinct('seatId');
  occupied = new Set(ids.filter(Boolean));
  ready = true;
  version += 1;
  broadcast({ type: 'reset', v: version, seats: [...occupied] });
}

const ensureReady = () =>
  (readyPromise ??= rebuild().catch((err) => {
    readyPromise = null;
    throw err;
  }));

// Gộp nhiều thay đổi liên tiếp (vd. xóa hàng loạt) thành 1 lần nạp lại
export function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuild().catch((err) => console.error('seatEvents: không nạp lại được danh sách ghế:', err.message));
  }, 200);
}

// Gọi khi một bản ghi điểm danh có ghế được lưu
export function seatTaken(seatId) {
  if (!seatId) return;
  if (!ready) return scheduleRebuild();
  if (occupied.has(seatId)) return; // ghế đã mờ rồi (1 mã được 2 người quét): không cần báo lại
  occupied.add(seatId);
  version += 1;
  broadcast({ type: 'seat', v: version, seatId });
}

// GET /api/seats/occupied: bản chụp hiện tại (đọc từ bộ nhớ, không chạm DB sau lần đầu)
export async function occupiedSnapshot(_req, res) {
  await ensureReady();
  res.set('Cache-Control', 'no-store');
  res.json({ v: version, seats: [...occupied] });
}

// GET /api/seats/stream: luồng SSE. Công khai vì EventSource không gửi được header Authorization,
// và dữ liệu chỉ là mã ghế đã có người.
export function occupiedStream(req, res) {
  if (clients.size >= MAX_CLIENTS) {
    return res.status(503).json({ message: 'Máy chủ đang bận, vui lòng thử lại sau ít giây.' });
  }
  req.socket.setNoDelay(true);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n'); // trình duyệt tự nối lại sau 5 giây nếu rớt
  res.flushHeaders();
  clients.add(res);
  req.on('close', () => clients.delete(res));
}

setInterval(() => send(': ping\n\n'), HEARTBEAT_MS).unref();

// Đóng các luồng đang mở khi tắt server (nếu không server.close() sẽ chờ mãi)
export function closeStreams() {
  for (const res of clients) res.end();
  clients.clear();
}
