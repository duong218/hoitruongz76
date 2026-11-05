import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Các nhóm route khác (auth, employees, ...) sẽ thêm ở các giai đoạn sau
app.use('/api/health', healthRoutes);

app.use('/api', notFound);
app.use(errorHandler);

export default app;
