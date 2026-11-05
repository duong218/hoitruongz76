import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', eventController.getSettings);
router.put('/', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), eventController.updateSettings);

export default router;
