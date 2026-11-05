import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();

router.get('/', employeeController.getAll);
router.post('/', authenticate, authorize(ROLES.ADMIN), employeeController.create);
router.put('/:code', authenticate, authorize(ROLES.ADMIN), employeeController.update);
router.delete('/:code', authenticate, authorize(ROLES.ADMIN), employeeController.delete);
router.post('/import', authenticate, authorize(ROLES.ADMIN), employeeController.importEmployees);

export default router;
