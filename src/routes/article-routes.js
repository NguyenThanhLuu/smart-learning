import { Router } from 'express';

import {
  createArticle,
  deleteArticle,
  getArticle,
  listArticles,
  updateArticle,
} from '../controllers/article-controller.js';
import { validateBody } from '../middleware/validate-body.js';
import { createArticleSchema } from '../schemas/request-schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router
  .route('/')
  .get(asyncHandler(listArticles))
  .post(validateBody(createArticleSchema), asyncHandler(createArticle));
router
  .route('/:id')
  .get(asyncHandler(getArticle))
  .patch(asyncHandler(updateArticle))
  .delete(asyncHandler(deleteArticle));

export default router;
