import { env } from '../config/env.js';

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/api/auth',
  };
}

export function setRefreshTokenCookie(response, token) {
  response.cookie(env.refreshTokenCookieName, token, {
    ...baseCookieOptions(),
    maxAge: env.refreshTokenMaxAgeMs,
  });
}

export function clearRefreshTokenCookie(response) {
  response.clearCookie(env.refreshTokenCookieName, baseCookieOptions());
}

export function readRefreshTokenCookie(request) {
  const cookieHeader = request.get('cookie') || '';

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) continue;

    const name = cookie.slice(0, separatorIndex).trim();
    if (name !== env.refreshTokenCookieName) continue;

    return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
  }

  return '';
}
