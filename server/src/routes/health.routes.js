import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/', (req, res) => {
  const state = mongoose.connection.readyState;
  res.status(state === 1 ? 200 : 503).json({
    ok: state === 1,
    db: DB_STATES[state] || 'unknown',
    time: new Date().toISOString(),
  });
});

export default router;
