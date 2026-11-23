import { connectDatabase } from '../config/database.js';

export async function ensureDatabase(_request, _response, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}
