import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { hashAccessCode, normalizeAccessCode } from '../utils/access-code.js';
import { ensureAccountIsActive } from '../utils/account-status.js';
import { ApiError } from '../utils/api-error.js';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../utils/refresh-cookie.js';
import { serializeUser } from '../utils/serializers.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

function sendSession(response, user) {
  setRefreshTokenCookie(response, createRefreshToken(user));
  response.json({
    data: {
      accessToken: createAccessToken(user),
      user: serializeUser(user),
    },
  });
}

export async function loginWithCode(request, response) {
  const code = normalizeAccessCode(request.body.code);
  const codeHash = hashAccessCode(code, env.codePepper);
  const user = await User.findOne({ codeHash });

  if (!user) {
    throw new ApiError(401, "User's code incorrect!");
  }

  ensureAccountIsActive(user);
  const now = new Date();
  user.lastLoginAt = now;
  user.lastSeenAt = now;
  await user.save();
  sendSession(response, user);
}

export async function refreshSession(request, response) {
  const refreshToken = readRefreshTokenCookie(request);

  if (!refreshToken) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new ApiError(
        401,
        'Your session has expired. Please sign in again.'
      );
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(
        401,
        'Your session has expired. Please sign in again.'
      );
    }

    ensureAccountIsActive(user);

    if (payload.version !== (user.tokenVersion || 0)) {
      throw new ApiError(
        401,
        'Your session has expired. Please sign in again.'
      );
    }

    response.json({
      data: {
        accessToken: createAccessToken(user),
        user: serializeUser(user),
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(response);

    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
}

export async function logout(request, response) {
  const refreshToken = readRefreshTokenCookie(request);

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      if (payload.type === 'refresh') {
        const tokenVersionFilter =
          payload.version === 0
            ? {
                $or: [
                  { tokenVersion: 0 },
                  { tokenVersion: { $exists: false } },
                ],
              }
            : { tokenVersion: payload.version };

        await User.findOneAndUpdate(
          { _id: payload.sub, ...tokenVersionFilter },
          { $inc: { tokenVersion: 1 } }
        );
      }
    } catch {
      // Invalid or expired cookies are cleared below.
    }
  }

  clearRefreshTokenCookie(response);
  response.json({ data: { success: true } });
}
