import { Router } from 'express';

import {
  createVisit,
  getUserActivity,
  listUserActivity,
  touchVisit,
} from '../controllers/activity-controller.js';
import { requireRole } from '../middleware/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/visits', asyncHandler(createVisit));
router.patch('/visits/:id', asyncHandler(touchVisit));
router.get('/users', requireRole('admin'), asyncHandler(listUserActivity));
router.get(
  '/users/:userId',
  requireRole('admin'),
  asyncHandler(getUserActivity)
);

export default router;
