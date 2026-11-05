import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', authenticate, authorize(ROLES.ADMIN), auditController.list);

export default router;
