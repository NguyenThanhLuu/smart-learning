import { ApiError } from '../utils/api-error.js';

export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!allowedRoles.includes(request.user?.role)) {
      next(new ApiError(403, 'You do not have permission for this action.'));
      return;
    }

    next();
  };
}
