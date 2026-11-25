import { Router } from 'express';

import {
  createVocabulary,
  deleteVocabulary,
  findVocabularyByName,
  listVocabulary,
  updateVocabulary,
} from '../controllers/vocabulary-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middleware/validate-body.js';
import {
  createVocabularySchema,
  updateVocabularySchema,
} from '../schemas/request-schemas.js';

const router = Router();

router
  .route('/')
  .get(asyncHandler(listVocabulary))
  .post(validateBody(createVocabularySchema), asyncHandler(createVocabulary));
router.get('/search', asyncHandler(findVocabularyByName));
router
  .route('/:id')
  .patch(validateBody(updateVocabularySchema), asyncHandler(updateVocabulary))
  .delete(asyncHandler(deleteVocabulary));

export default router;
