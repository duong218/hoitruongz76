import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/staff/login', authController.loginStaff);
router.post('/attendee/lookup', authController.lookupAttendee);
router.post('/attendee/guest', authController.enterAsGuest);
router.get('/me', authenticate, authController.getMe);

export default router;
