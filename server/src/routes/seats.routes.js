import { Router } from 'express';
import { seatController } from '../controllers/seat.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', seatController.getAssignments);
router.post('/assign-seats', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), seatController.assignSeats);
router.post('/assign-rows', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), seatController.assignRows);

export default router;
