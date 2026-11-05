import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', attendanceController.getAll);
router.post('/checkin', attendanceController.checkIn);
router.post('/reset', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), attendanceController.reset);

export default router;
