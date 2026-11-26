import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCOUNT_INACTIVE_CODE,
  ACCOUNT_INACTIVE_MESSAGE,
  ensureAccountIsActive,
} from '../src/utils/account-status.js';
import { errorHandler } from '../src/middleware/errors.js';
import { ApiError } from '../src/utils/api-error.js';

test('active accounts pass the account status check', () => {
  assert.doesNotThrow(() => ensureAccountIsActive({ isActive: true }));
  assert.doesNotThrow(() => ensureAccountIsActive({}));
});

test('inactive accounts receive a machine-readable forbidden error', () => {
  assert.throws(
    () => ensureAccountIsActive({ isActive: false }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, ACCOUNT_INACTIVE_CODE);
      assert.equal(error.message, ACCOUNT_INACTIVE_MESSAGE);
      return true;
    }
  );
});

test('API errors expose the inactive account code in the response', () => {
  let responseStatus;
  let responsePayload;
  const response = {
    status(statusCode) {
      responseStatus = statusCode;
      return this;
    },
    json(payload) {
      responsePayload = payload;
    },
  };

  errorHandler(
    new ApiError(
      403,
      ACCOUNT_INACTIVE_MESSAGE,
      undefined,
      ACCOUNT_INACTIVE_CODE
    ),
    {},
    response,
    () => {}
  );

  assert.equal(responseStatus, 403);
  assert.deepEqual(responsePayload, {
    code: ACCOUNT_INACTIVE_CODE,
    message: ACCOUNT_INACTIVE_MESSAGE,
  });
});
