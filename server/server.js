import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${env.PORT}`);
    console.log(`Kiểm tra nhanh: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = async (signal) => {
    console.log(`\nNhận ${signal}, đang tắt server...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
