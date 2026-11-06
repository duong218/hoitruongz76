import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', eventController.getSettings);
router.get('/tokens', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), eventController.getSeatTokens);
router.put('/', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), eventController.updateSettings);
router.post('/start-new', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), eventController.startNew);

export default router;
