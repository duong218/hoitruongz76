import { Router } from 'express';
import { groupController } from '../controllers/group.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', groupController.getAll);
router.get('/:id/usage', groupController.getUsage);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), groupController.create);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), groupController.update);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), groupController.delete);

export default router;
