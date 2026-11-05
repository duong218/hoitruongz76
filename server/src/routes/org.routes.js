import { Router } from 'express';
import { orgController } from '../controllers/org.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

// Blocks
router.get('/blocks', orgController.getBlocks);
router.post('/blocks', authenticate, authorize(ROLES.ADMIN), orgController.createBlock);
router.put('/blocks/:id', authenticate, authorize(ROLES.ADMIN), orgController.updateBlock);
router.delete('/blocks/:id', authenticate, authorize(ROLES.ADMIN), orgController.deleteBlock);

// Departments
router.get('/departments', orgController.getDepartments);
router.post('/departments', authenticate, authorize(ROLES.ADMIN), orgController.createDepartment);
router.put('/departments/:id', authenticate, authorize(ROLES.ADMIN), orgController.updateDepartment);
router.delete('/departments/:id', authenticate, authorize(ROLES.ADMIN), orgController.deleteDepartment);

export default router;
