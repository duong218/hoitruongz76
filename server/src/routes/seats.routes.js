import { Router } from 'express';
import { seatController } from '../controllers/seat.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';
import { occupiedSnapshot, occupiedStream } from '../utils/seatEvents.js';

const router = Router();

router.get('/', seatController.getAssignments);
// Ghế đã có người điểm danh (công khai, chỉ có mã ghế): bản chụp + luồng cập nhật tức thì
router.get('/occupied', occupiedSnapshot);
router.get('/stream', occupiedStream);
router.post('/assign-seats', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), seatController.assignSeats);
router.post('/assign-rows', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), seatController.assignRows);

export default router;
