import { createHmac, timingSafeEqual } from 'node:crypto';

export function normalizeAccessCode(code) {
  return typeof code === 'string' ? code.trim() : '';
}

export function hashAccessCode(code, pepper) {
  const normalizedCode = normalizeAccessCode(code);

  if (!normalizedCode) {
    throw new Error('Access code is required.');
  }

  if (!pepper) {
    throw new Error('CODE_PEPPER is required.');
  }

  return createHmac('sha256', pepper).update(normalizedCode).digest('hex');
}

export function accessCodeHashesMatch(leftHash, rightHash) {
  if (!leftHash || !rightHash || leftHash.length !== rightHash.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(leftHash), Buffer.from(rightHash));
}
