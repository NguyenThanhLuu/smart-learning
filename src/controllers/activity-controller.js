import { User } from '../models/User.js';

function isoDate(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export async function touchActivity(request, response) {
  const lastSeenAt = new Date();

  await User.updateOne({ _id: request.user._id }, { $set: { lastSeenAt } });

  response.json({ data: { last_active: lastSeenAt.toISOString() } });
}

export async function listUserActivity(_request, response) {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('name lastSeenAt')
    .sort({ lastSeenAt: -1, name: 1 })
    .lean();

  response.json({
    data: users.map((user) => ({
      user: user.name,
      last_active: isoDate(user.lastSeenAt),
    })),
  });
}
