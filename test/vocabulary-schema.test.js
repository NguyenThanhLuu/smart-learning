import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createVocabularySchema,
  updateVocabularySchema,
} from '../src/schemas/request-schemas.js';

test('validates vocabulary creation fields', () => {
  const result = createVocabularySchema.safeParse({
    name: ' example ',
    pronounce: ' ig-zam-puhl ',
    meaning: ' example meaning ',
    timesReviewed: 0,
    reviewDate: '2026-11-26 00:00:00',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.name, 'example');
  assert.equal(result.data.pronounce, 'ig-zam-puhl');
});

test('accepts vocabulary text edits and review progress updates', () => {
  assert.equal(
    updateVocabularySchema.safeParse({
      name: 'updated',
      pronounce: 'updated pronunciation',
      meaning: 'updated meaning',
    }).success,
    true
  );
  assert.equal(
    updateVocabularySchema.safeParse({
      reviewDate: '2026-11-27 00:00:00',
      timesReviewed: 3,
    }).success,
    true
  );
});

test('rejects incomplete vocabulary text edits', () => {
  const result = updateVocabularySchema.safeParse({
    name: 'updated',
    pronounce: '',
    meaning: 'updated meaning',
  });

  assert.equal(result.success, false);
});
