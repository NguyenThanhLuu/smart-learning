import { ApiError } from './api-error.js';

export const ACCOUNT_INACTIVE_CODE = 'ACCOUNT_INACTIVE';
export const ACCOUNT_INACTIVE_MESSAGE =
  'This account has been deactivated. Contact an administrator.';

export function ensureAccountIsActive(user) {
  if (user?.isActive === false) {
    throw new ApiError(
      403,
      ACCOUNT_INACTIVE_MESSAGE,
      undefined,
      ACCOUNT_INACTIVE_CODE
    );
  }
}
