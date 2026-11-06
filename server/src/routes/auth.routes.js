import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { staffLoginLimiter, attendeeLookupLimiter, guestLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/staff/login', staffLoginLimiter, authController.loginStaff);
router.post('/attendee/lookup', attendeeLookupLimiter, authController.lookupAttendee);
router.post('/attendee/guest', guestLimiter, authController.enterAsGuest);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
