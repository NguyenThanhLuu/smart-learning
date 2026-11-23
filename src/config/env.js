import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = Object.freeze({
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '5d',
  refreshTokenMaxAgeMs: 5 * 24 * 60 * 60 * 1000,
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || '',
  refreshTokenCookieName: 'smartLanguageRefreshToken',
  cookieSecure: nodeEnv === 'production',
  cookieSameSite: nodeEnv === 'production' ? 'none' : 'lax',
  codePepper: process.env.CODE_PEPPER || '',
  jsonLimit: process.env.JSON_LIMIT || '10mb',
});

export function requireEnvironment(names) {
  const missing = names.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}`
    );
  }
}

export function assertServerEnvironment() {
  requireEnvironment([
    'MONGODB_URI',
    'JWT_SECRET',
    'CODE_PEPPER',
    ...(env.nodeEnv === 'production' ? ['REFRESH_TOKEN_SECRET'] : []),
  ]);

  if (
    env.jwtSecret.length < 32 ||
    env.refreshTokenSecret.length < 32 ||
    env.codePepper.length < 32
  ) {
    throw new Error(
      'JWT_SECRET, REFRESH_TOKEN_SECRET, and CODE_PEPPER must be at least 32 characters.'
    );
  }

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
}
