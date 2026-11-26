import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import {
  createVisit,
  listUserActivity,
  touchVisit,
} from '../src/controllers/activity-controller.js';
import { User } from '../src/models/User.js';
import { UserVisit } from '../src/models/UserVisit.js';

function createResponseRecorder() {
  return {
    payload: undefined,
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };
}

test('creating a visit increments only the authenticated user', async () => {
  const originalCreate = UserVisit.create;
  const originalUpdateOne = User.updateOne;
  const userId = new mongoose.Types.ObjectId();
  const visitId = new mongoose.Types.ObjectId();
  let createdVisit;
  let userFilter;
  let userUpdate;

  UserVisit.create = async (visit) => {
    createdVisit = visit;
    return { _id: visitId, ...visit };
  };
  User.updateOne = async (filter, update) => {
    userFilter = filter;
    userUpdate = update;
  };

  try {
    const response = createResponseRecorder();
    await createVisit({ user: { _id: userId } }, response);

    assert.equal(createdVisit.user, userId);
    assert.deepEqual(userFilter, { _id: userId });
    assert.equal(userUpdate.$inc.visitCount, 1);
    assert.equal(response.statusCode, 201);
    assert.equal(response.payload.data.id, visitId.toString());
  } finally {
    UserVisit.create = originalCreate;
    User.updateOne = originalUpdateOne;
  }
});

test('heartbeat can update only a visit owned by the authenticated user', async () => {
  const originalFindOneAndUpdate = UserVisit.findOneAndUpdate;
  const originalUpdateOne = User.updateOne;
  const userId = new mongoose.Types.ObjectId();
  const visitId = new mongoose.Types.ObjectId();
  let visitFilter;

  UserVisit.findOneAndUpdate = async (filter, update) => {
    visitFilter = filter;
    return {
      _id: visitId,
      user: userId,
      startedAt: new Date('2026-11-26T01:00:00.000Z'),
      lastSeenAt: update.$set.lastSeenAt,
    };
  };
  User.updateOne = async () => {};

  try {
    const response = createResponseRecorder();
    await touchVisit(
      { params: { id: visitId.toString() }, user: { _id: userId } },
      response
    );

    assert.deepEqual(visitFilter, {
      _id: visitId.toString(),
      user: userId,
    });
    assert.equal(response.payload.data.id, visitId.toString());
  } finally {
    UserVisit.findOneAndUpdate = originalFindOneAndUpdate;
    User.updateOne = originalUpdateOne;
  }
});

test('activity list excludes admins and combines recent visit totals', async () => {
  const originalFind = User.find;
  const originalAggregate = UserVisit.aggregate;
  const userId = new mongoose.Types.ObjectId();
  let userFilter;

  User.find = (filter) => {
    userFilter = filter;
    return {
      select() {
        return this;
      },
      sort() {
        return this;
      },
      async lean() {
        return [
          {
            _id: userId,
            name: 'Learner',
            role: 'user',
            visitCount: 8,
          },
        ];
      },
    };
  };
  UserVisit.aggregate = async () => [
    { _id: userId, visitsLast7Days: 2, visitsLast30Days: 5 },
  ];

  try {
    const response = createResponseRecorder();
    await listUserActivity({}, response);

    assert.deepEqual(userFilter, { role: { $ne: 'admin' } });
    assert.equal(response.payload.data[0].visitCount, 8);
    assert.equal(response.payload.data[0].visitsLast7Days, 2);
    assert.equal(response.payload.data[0].visitsLast30Days, 5);
  } finally {
    User.find = originalFind;
    UserVisit.aggregate = originalAggregate;
  }
});
