import sql from 'mssql';
import { env } from './env.js';
import { initSchema } from './schema.js';

let pool = null;

const sqlConfig = env.DB_CONNECTION_STRING
  ? env.DB_CONNECTION_STRING
  : {
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      server: env.DB_SERVER,
      port: env.DB_PORT,
      pool: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: env.DB_ENCRYPT,
        trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      },
    };

export async function connectDB() {
  try {
    if (pool && pool.connected) return pool;
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log(`Đã kết nối SQL Server: ${env.DB_NAME} (${env.DB_SERVER}:${env.DB_PORT})`);
    await initSchema(pool);
    return pool;
  } catch (err) {
    throw new Error(
      `Không kết nối được SQL Server (${env.DB_SERVER}:${env.DB_PORT}, DB: ${env.DB_NAME}).\n` +
        'Hãy kiểm tra dịch vụ SQL Server đã chạy chưa và thông tin đăng nhập trong .env.\n' +
        `Chi tiết: ${err.message}`
    );
  }
}

export function getPool() {
  if (!pool || !pool.connected) {
    throw new Error('SQL Server chưa được kết nối. Hãy gọi connectDB() trước.');
  }
  return pool;
}

export async function disconnectDB() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
