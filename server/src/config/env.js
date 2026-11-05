import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Thiếu MONGO_URI trong file .env. Hãy sao chép .env.example thành .env rồi điền lại.');
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || '',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || '',
  SEED_MANAGER_PASSWORD: process.env.SEED_MANAGER_PASSWORD || '',
};
