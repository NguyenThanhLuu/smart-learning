import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

import { env } from '../config/env.js';

export function createAccessToken(user) {
  return jwt.sign(
    {
      type: 'access',
      version: user.tokenVersion || 0,
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: env.accessTokenExpiresIn,
    }
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    {
      type: 'refresh',
      version: user.tokenVersion || 0,
    },
    env.refreshTokenSecret,
    {
      subject: user.id,
      expiresIn: env.refreshTokenExpiresIn,
      jwtid: randomUUID(),
    }
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret, {
    algorithms: ['HS256'],
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}
