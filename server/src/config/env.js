import 'dotenv/config';

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_NAME = process.env.DB_NAME || 'hoitruongz76';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = Number(process.env.DB_PORT) || 1433;
const DB_ENCRYPT = process.env.DB_ENCRYPT === 'true';
const DB_TRUST_SERVER_CERTIFICATE = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false';

if (!DB_PASSWORD && !process.env.DB_CONNECTION_STRING) {
  console.error('Thiếu DB_PASSWORD (hoặc DB_CONNECTION_STRING) trong file .env.');
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  DB_SERVER,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_PORT,
  DB_ENCRYPT,
  DB_TRUST_SERVER_CERTIFICATE,
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || '',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || '',
  SEED_MANAGER_PASSWORD: process.env.SEED_MANAGER_PASSWORD || '',
};
