import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  loginWithCode,
  logout,
  refreshSession,
} from '../controllers/auth-controller.js';
import { validateBody } from '../middleware/validate-body.js';
import { loginSchema } from '../schemas/request-schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const codeLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many refresh attempts. Please try again later.' },
});

router.post(
  '/code',
  codeLoginLimiter,
  validateBody(loginSchema),
  asyncHandler(loginWithCode)
);
router.post('/refresh', refreshLimiter, asyncHandler(refreshSession));
router.post('/logout', asyncHandler(logout));

export default router;
