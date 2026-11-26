import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import {
  listUserActivity,
  touchActivity,
} from '../src/controllers/activity-controller.js';
import { User } from '../src/models/User.js';

function createResponseRecorder() {
  return {
    payload: undefined,
    json(payload) {
      this.payload = payload;
    },
  };
}

test('heartbeat updates last activity for the authenticated user', async () => {
  const originalUpdateOne = User.updateOne;
  const userId = new mongoose.Types.ObjectId();
  let receivedFilter;
  let receivedUpdate;

  User.updateOne = async (filter, update) => {
    receivedFilter = filter;
    receivedUpdate = update;
  };

  try {
    const response = createResponseRecorder();
    await touchActivity({ user: { _id: userId } }, response);

    assert.deepEqual(receivedFilter, { _id: userId });
    assert.ok(receivedUpdate.$set.lastSeenAt instanceof Date);
    assert.equal(
      response.payload.data.last_active,
      receivedUpdate.$set.lastSeenAt.toISOString()
    );
  } finally {
    User.updateOne = originalUpdateOne;
  }
});

test('admin activity list returns only user and last active', async () => {
  const originalFind = User.find;
  const lastSeenAt = new Date('2026-11-26T01:00:00.000Z');

  User.find = () => ({
    select() {
      return this;
    },
    sort() {
      return this;
    },
    async lean() {
      return [{ name: 'Learner', lastSeenAt }];
    },
  });

  try {
    const response = createResponseRecorder();
    await listUserActivity({}, response);

    assert.deepEqual(response.payload.data, [
      { user: 'Learner', last_active: lastSeenAt.toISOString() },
    ]);
  } finally {
    User.find = originalFind;
  }
});
