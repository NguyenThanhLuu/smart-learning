import { User } from '../models/User.js';
import { UserVisit } from '../models/UserVisit.js';
import { ApiError } from '../utils/api-error.js';
import { serializeUser, serializeUserVisit } from '../utils/serializers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const VISIT_HISTORY_LIMIT = 50;

function isoDate(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function activityUser(user, counts = {}) {
  return {
    ...serializeUser(user),
    last_login_at: isoDate(user.lastLoginAt),
    last_seen_at: isoDate(user.lastSeenAt),
    visitCount: user.visitCount || 0,
    visitsLast7Days: counts.visitsLast7Days || 0,
    visitsLast30Days: counts.visitsLast30Days || 0,
  };
}

export async function createVisit(request, response) {
  const now = new Date();
  const visit = await UserVisit.create({
    user: request.user._id,
    startedAt: now,
    lastSeenAt: now,
  });

  await User.updateOne(
    { _id: request.user._id },
    {
      $set: { lastSeenAt: now },
      $inc: { visitCount: 1 },
    }
  );

  response.status(201).json({ data: serializeUserVisit(visit) });
}

export async function touchVisit(request, response) {
  const now = new Date();
  const visit = await UserVisit.findOneAndUpdate(
    { _id: request.params.id, user: request.user._id },
    { $set: { lastSeenAt: now } },
    { new: true }
  );

  if (!visit) {
    throw new ApiError(404, 'Visit not found.');
  }

  await User.updateOne(
    { _id: request.user._id },
    { $max: { lastSeenAt: now } }
  );

  response.json({ data: serializeUserVisit(visit) });
}

export async function listUserActivity(_request, response) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const [users, recentCounts] = await Promise.all([
    User.find({ role: { $ne: 'admin' } })
      .select(
        'name role isActive lastLoginAt lastSeenAt visitCount createdAt updatedAt'
      )
      .sort({ lastSeenAt: -1, name: 1 })
      .lean(),
    UserVisit.aggregate([
      { $match: { startedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$user',
          visitsLast30Days: { $sum: 1 },
          visitsLast7Days: {
            $sum: { $cond: [{ $gte: ['$startedAt', sevenDaysAgo] }, 1, 0] },
          },
        },
      },
    ]),
  ]);
  const countsByUser = new Map(
    recentCounts.map((counts) => [counts._id.toString(), counts])
  );

  response.json({
    data: users.map((user) =>
      activityUser(user, countsByUser.get(user._id.toString()))
    ),
  });
}

export async function getUserActivity(request, response) {
  const user = await User.findOne({
    _id: request.params.userId,
    role: { $ne: 'admin' },
  })
    .select(
      'name role isActive lastLoginAt lastSeenAt visitCount createdAt updatedAt'
    )
    .lean();

  if (!user) {
    throw new ApiError(404, 'Account not found.');
  }

  const [visits, recentCounts] = await Promise.all([
    UserVisit.find({ user: user._id })
      .sort({ startedAt: -1 })
      .limit(VISIT_HISTORY_LIMIT)
      .lean(),
    UserVisit.aggregate([
      {
        $match: {
          user: user._id,
          startedAt: { $gte: new Date(Date.now() - 30 * DAY_MS) },
        },
      },
      {
        $group: {
          _id: '$user',
          visitsLast30Days: { $sum: 1 },
          visitsLast7Days: {
            $sum: {
              $cond: [
                { $gte: ['$startedAt', new Date(Date.now() - 7 * DAY_MS)] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  response.json({
    data: {
      user: activityUser(user, recentCounts[0]),
      visits: visits.map(serializeUserVisit),
    },
  });
}
