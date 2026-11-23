import { Router } from 'express';

import {
  createUser,
  getCurrentUser,
  updateCurrentUser,
} from '../controllers/user-controller.js';
import { requireRole } from '../middleware/require-role.js';
import { validateBody } from '../middleware/validate-body.js';
import { userAccountSchema } from '../schemas/request-schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/me', asyncHandler(getCurrentUser));
router.patch(
  '/me',
  validateBody(userAccountSchema),
  asyncHandler(updateCurrentUser)
);
router.post(
  '/',
  requireRole('admin'),
  validateBody(userAccountSchema),
  asyncHandler(createUser)
);

export default router;
