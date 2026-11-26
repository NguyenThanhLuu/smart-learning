import { Router } from 'express';

import {
  listUserActivity,
  touchActivity,
} from '../controllers/activity-controller.js';
import { requireRole } from '../middleware/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.patch('/me', asyncHandler(touchActivity));
router.get('/users', requireRole('admin'), asyncHandler(listUserActivity));

export default router;
