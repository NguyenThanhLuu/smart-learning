import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

export function notFound(request, _response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.path}`));
}

export function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'The submitted data is invalid.';
    details = Object.values(error.errors).map((item) => item.message);
  } else if (error.name === 'CastError') {
    statusCode = 404;
    message = 'The requested record was not found.';
  } else if (error.code === 11000) {
    statusCode = 409;
    if (error.keyPattern?.normalizedName) {
      message = 'This username already exists. Please choose another username.';
    } else if (error.keyPattern?.codeHash) {
      message = 'This passcode already exists. Please choose another passcode.';
    } else if (error.keyPattern?.name) {
      message = 'This vocabulary already exists!';
    } else {
      message = 'A record with this value already exists.';
    }
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'The request body is not valid JSON.';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500
      ? { stack: error.stack }
      : {}),
  });
}
