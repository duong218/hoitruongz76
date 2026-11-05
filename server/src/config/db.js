import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Đã kết nối MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    throw new Error(
      `Không kết nối được MongoDB tại ${env.MONGO_URI}.\n` +
        'Hãy kiểm tra dịch vụ MongoDB đã chạy chưa (Windows: Services > MongoDB Server).\n' +
        `Chi tiết: ${err.message}`
    );
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
