import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { staffLoginLimiter, attendeeLookupLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/staff/login', staffLoginLimiter, authController.loginStaff);
router.post('/attendee/lookup', attendeeLookupLimiter, authController.lookupAttendee);
router.post('/attendee/guest', authController.enterAsGuest);
router.get('/me', authenticate, authController.getMe);

export default router;
