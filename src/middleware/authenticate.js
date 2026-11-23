import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/token.js';

export async function authenticate(request, _response, next) {
  try {
    const authorization = request.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication is required.');
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new ApiError(401, 'This session is invalid or has expired.');
    }

    await connectDatabase();
    const user = await User.findById(payload.sub);

    if (!user || payload.version !== (user.tokenVersion || 0)) {
      throw new ApiError(401, 'This session is no longer valid.');
    }

    request.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, 'This session is invalid or has expired.'));
  }
}
