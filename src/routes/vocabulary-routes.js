import { Router } from 'express';

import {
  createVocabulary,
  deleteVocabulary,
  findVocabularyByName,
  listVocabulary,
  updateVocabulary,
} from '../controllers/vocabulary-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router
  .route('/')
  .get(asyncHandler(listVocabulary))
  .post(asyncHandler(createVocabulary));
router.get('/search', asyncHandler(findVocabularyByName));
router
  .route('/:id')
  .patch(asyncHandler(updateVocabulary))
  .delete(asyncHandler(deleteVocabulary));

export default router;
