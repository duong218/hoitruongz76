import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { archiveIfEnded } from './src/utils/archive.js';

async function start() {
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('⚠️ [CẢNH BÁO MONGODB]:', dbErr.message);
    console.log('👉 Server vẫn sẽ chạy để phục vụ health-check và các API (khi MongoDB sẵn sàng sẽ kết nối lại).');
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${env.PORT}`);
  });

  // Hết giờ đóng thì tự lưu lịch sử. ponytail: bộ đếm trong tiến trình, chạy nhiều bản server thì cần khóa trong DB.
  archiveIfEnded();
  const timer = setInterval(archiveIfEnded, 30 * 1000);

  const shutdown = async (signal) => {
    console.log(`\nNhận ${signal}, đang tắt server...`);
    clearInterval(timer);
    server.close(async () => {
      try {
        await disconnectDB();
      } catch {}
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('❌ Lỗi khởi động server:', err);
});
