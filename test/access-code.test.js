import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accessCodeHashesMatch,
  hashAccessCode,
  normalizeAccessCode,
} from '../src/utils/access-code.js';

test('normalizes whitespace around access codes', () => {
  assert.equal(normalizeAccessCode('  example-code  '), 'example-code');
});

test('hashes the same normalized code deterministically', () => {
  const pepper = 'a-secure-test-pepper-that-is-long-enough';
  const first = hashAccessCode(' example-code ', pepper);
  const second = hashAccessCode('example-code', pepper);

  assert.equal(first, second);
  assert.equal(accessCodeHashesMatch(first, second), true);
});

test('different codes produce different hashes', () => {
  const pepper = 'a-secure-test-pepper-that-is-long-enough';
  const first = hashAccessCode('first-code', pepper);
  const second = hashAccessCode('second-code', pepper);

  assert.notEqual(first, second);
  assert.equal(accessCodeHashesMatch(first, second), false);
});
