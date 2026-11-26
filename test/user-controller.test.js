import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import {
  activateUserAccount,
  deactivateUserAccount,
  listUserAccounts,
} from '../src/controllers/user-controller.js';
import { User } from '../src/models/User.js';

function createResponseRecorder() {
  return {
    payload: undefined,
    json(payload) {
      this.payload = payload;
    },
  };
}

test('account listing excludes admin users at the database query', async () => {
  const originalFind = User.find;
  const accountId = new mongoose.Types.ObjectId();
  let receivedFilter;
  let receivedSelection;
  let receivedSort;

  User.find = (filter) => {
    receivedFilter = filter;
    return {
      select(selection) {
        receivedSelection = selection;
        return this;
      },
      sort(sort) {
        receivedSort = sort;
        return this;
      },
      async lean() {
        return [
          {
            _id: accountId,
            name: 'User Account',
            role: 'user',
            isActive: true,
          },
        ];
      },
    };
  };

  try {
    const response = createResponseRecorder();
    await listUserAccounts({}, response);

    assert.deepEqual(receivedFilter, { role: { $ne: 'admin' } });
    assert.equal(receivedSelection, 'name role isActive createdAt updatedAt');
    assert.deepEqual(receivedSort, { createdAt: -1 });
    assert.equal(response.payload.data[0].id, accountId.toString());
    assert.equal(response.payload.data[0].isActive, true);
  } finally {
    User.find = originalFind;
  }
});

test('deactivation targets only non-admin users and revokes current tokens', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const accountId = new mongoose.Types.ObjectId();
  let receivedFilter;
  let receivedUpdate;
  let receivedOptions;

  User.findOneAndUpdate = async (filter, update, options) => {
    receivedFilter = filter;
    receivedUpdate = update;
    receivedOptions = options;
    return {
      _id: accountId,
      name: 'User Account',
      role: 'user',
      isActive: false,
    };
  };

  try {
    const response = createResponseRecorder();
    await deactivateUserAccount(
      { params: { id: accountId.toString() } },
      response
    );

    assert.deepEqual(receivedFilter, {
      _id: accountId.toString(),
      role: { $ne: 'admin' },
    });
    assert.deepEqual(receivedUpdate, {
      $set: { isActive: false },
      $inc: { tokenVersion: 1 },
    });
    assert.deepEqual(receivedOptions, { new: true, runValidators: true });
    assert.equal(response.payload.data.isActive, false);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('activation restores access while still revoking stale tokens', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const accountId = new mongoose.Types.ObjectId();
  let receivedUpdate;

  User.findOneAndUpdate = async (_filter, update) => {
    receivedUpdate = update;
    return {
      _id: accountId,
      name: 'User Account',
      role: 'user',
      isActive: true,
    };
  };

  try {
    const response = createResponseRecorder();
    await activateUserAccount(
      { params: { id: accountId.toString() } },
      response
    );

    assert.deepEqual(receivedUpdate, {
      $set: { isActive: true },
      $inc: { tokenVersion: 1 },
    });
    assert.equal(response.payload.data.isActive, true);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
