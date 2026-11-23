import { ApiError } from '../utils/api-error.js';

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      next(new ApiError(400, details[0]?.message || 'Invalid request.', details));
      return;
    }

    request.body = result.data;
    next();
  };
}
