import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', optionalAuth, attendanceController.getAll);
router.post('/checkin', authenticate, authorize(ROLES.EMPLOYEE), attendanceController.checkIn);
router.post('/reset', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), attendanceController.reset);

export default router;
