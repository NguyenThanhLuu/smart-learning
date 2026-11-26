import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import { Article } from '../src/models/Article.js';
import { User } from '../src/models/User.js';
import { Vocabulary } from '../src/models/Vocabulary.js';
import {
  serializeArticle,
  serializeUser,
  serializeVocabulary,
} from '../src/utils/serializers.js';

test('new users are active by default and expose their account status', async () => {
  const user = new User({
    name: 'Test User',
    normalizedName: 'test user',
    codeHash: 'test-code-hash',
  });

  await user.validate();
  const result = serializeUser(user);

  assert.equal(user.isActive, true);
  assert.equal(result.isActive, true);
  assert.equal(result.role, 'user');
});

test('vocabulary keeps the frontend field contract', async () => {
  const user = new mongoose.Types.ObjectId();
  const vocabulary = new Vocabulary({
    name: 'Example',
    pronounce: 'ig-zam-puhl',
    meaning: 'ví dụ',
    timesReviewed: 2,
    reviewDate: '2026-11-23 00:00:00',
    user,
  });

  await vocabulary.validate();
  const result = serializeVocabulary(vocabulary);

  assert.equal(result.name, 'example');
  assert.equal(result.userId, user.toString());
  assert.equal(result.timesReviewed, 2);
  assert.equal(result.reviewDate, '2026-11-23 00:00:00');
});

test('article keeps id, created_at, and highlightTo fields', async () => {
  const user = new mongoose.Types.ObjectId();
  const article = new Article({
    title: 'Test article',
    content: '0:00 Example transcript',
    highlightTo: '0:00',
    user,
  });

  await article.validate();
  const result = serializeArticle(article);

  assert.equal(result.id, article.id);
  assert.equal(result.userId, user.toString());
  assert.equal(result.highlightTo, '0:00');
  assert.equal(result.created_at, undefined);
});
