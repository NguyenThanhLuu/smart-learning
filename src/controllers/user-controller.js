import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { hashAccessCode } from '../utils/access-code.js';
import { ApiError } from '../utils/api-error.js';
import { serializeUser } from '../utils/serializers.js';
import { normalizeUserName } from '../utils/user-name.js';

async function ensureAccountValuesAreAvailable({
  name,
  codeHash,
  excludeUserId,
}) {
  const excludedUser = excludeUserId ? { _id: { $ne: excludeUserId } } : {};
  const normalizedName = normalizeUserName(name);
  const [nameExists, codeExists] = await Promise.all([
    User.exists({ normalizedName, ...excludedUser }),
    User.exists({ codeHash, ...excludedUser }),
  ]);

  if (nameExists) {
    throw new ApiError(
      409,
      'This username already exists. Please choose another username.'
    );
  }

  if (codeExists) {
    throw new ApiError(
      409,
      'This passcode already exists. Please choose another passcode.'
    );
  }

  return normalizedName;
}

export async function getCurrentUser(request, response) {
  response.json({ data: serializeUser(request.user) });
}

export async function listUserAccounts(_request, response) {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('name role isActive createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  response.json({ data: users.map(serializeUser) });
}

export async function createUser(request, response) {
  const { name, code } = request.body;
  const codeHash = hashAccessCode(code, env.codePepper);
  const normalizedName = await ensureAccountValuesAreAvailable({
    name,
    codeHash,
  });

  const user = await User.create({
    name,
    normalizedName,
    codeHash,
    role: 'user',
  });

  response.status(201).json({ data: serializeUser(user) });
}

export async function updateCurrentUser(request, response) {
  const { name, code } = request.body;
  const codeHash = hashAccessCode(code, env.codePepper);
  const normalizedName = await ensureAccountValuesAreAvailable({
    name,
    codeHash,
    excludeUserId: request.user._id,
  });

  request.user.name = name;
  request.user.normalizedName = normalizedName;
  request.user.codeHash = codeHash;
  request.user.tokenVersion = (request.user.tokenVersion || 0) + 1;
  await request.user.save();

  response.json({ data: serializeUser(request.user) });
}

async function updateUserAccountStatus(request, response, isActive) {
  const user = await User.findOneAndUpdate(
    { _id: request.params.id, role: { $ne: 'admin' } },
    {
      $set: { isActive },
      $inc: { tokenVersion: 1 },
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'Account not found.');
  }

  response.json({ data: serializeUser(user) });
}

export async function activateUserAccount(request, response) {
  return updateUserAccountStatus(request, response, true);
}

export async function deactivateUserAccount(request, response) {
  return updateUserAccountStatus(request, response, false);
}
