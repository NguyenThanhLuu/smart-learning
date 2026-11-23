import { Article } from '../models/Article.js';
import { ApiError } from '../utils/api-error.js';
import { serializeArticle } from '../utils/serializers.js';

export async function listArticles(request, response) {
  const articles = await Article.find({ user: request.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name createdAt');

  response.json({ data: articles.map(serializeArticle) });
}

export async function getArticle(request, response) {
  const article = await Article.findOne({
    _id: request.params.id,
    user: request.user._id,
  });

  if (!article) {
    throw new ApiError(404, 'Article could not be loaded.');
  }

  response.json({ data: serializeArticle(article) });
}

export async function createArticle(request, response) {
  const article = await Article.create({
    title: request.body?.title,
    content: request.body?.content,
    user: request.user._id,
  });

  response.status(201).json({ data: serializeArticle(article) });
}

export async function updateArticle(request, response) {
  if (typeof request.body?.highlightTo !== 'string') {
    throw new ApiError(400, 'highlightTo must be a string.');
  }

  const article = await Article.findOneAndUpdate(
    { _id: request.params.id, user: request.user._id },
    { highlightTo: request.body.highlightTo },
    { new: true, runValidators: true }
  );

  if (!article) {
    throw new ApiError(404, 'Article could not be updated.');
  }

  response.json({ data: serializeArticle(article) });
}

export async function deleteArticle(request, response) {
  const article = await Article.findOneAndDelete({
    _id: request.params.id,
    user: request.user._id,
  });

  if (!article) {
    throw new ApiError(404, 'Article could not be deleted.');
  }

  response.json({ data: { id: article.id } });
}
