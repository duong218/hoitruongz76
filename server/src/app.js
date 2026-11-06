import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employees.routes.js';
import orgRoutes from './routes/org.routes.js';
import groupRoutes from './routes/groups.routes.js';
import seatRoutes from './routes/seats.routes.js';
import eventRoutes from './routes/events.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import auditRoutes from './routes/audit.routes.js';
import historyRoutes from './routes/history.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
// Chạy sau Caddy (1 lớp proxy): lấy IP thật của người dùng cho rate limit
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Đăng ký API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/history', historyRoutes);

app.use('/api', notFound);
app.use(errorHandler);

export default app;
