import { Router } from 'express';
import { historyController } from '../controllers/history.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.server.js';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER));

// Chỉ đọc: cố ý không có route sửa/xóa lịch sử.
router.get('/', historyController.list);
router.get('/:id', historyController.detail);
router.post('/:id/export-log', historyController.logExport);

export default router;
