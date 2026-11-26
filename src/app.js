import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { authenticate } from './middleware/authenticate.js';
import { ensureDatabase } from './middleware/ensure-database.js';
import { errorHandler, notFound } from './middleware/errors.js';
import activityRoutes from './routes/activity-routes.js';
import articleRoutes from './routes/article-routes.js';
import authRoutes from './routes/auth-routes.js';
import userRoutes from './routes/user-routes.js';
import vocabularyRoutes from './routes/vocabulary-routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: env.jsonLimit }));

app.get('/', (_request, response) => {
  response.json({
    data: {
      name: 'Smart Language Learning API',
      status: 'ok',
      health: '/api/health',
    },
  });
});

app.get('/api/health', (_request, response) => {
  response.json({
    data: {
      status: 'ok',
      database:
        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api/auth', ensureDatabase, authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/activity', authenticate, activityRoutes);
app.use('/api/articles', authenticate, articleRoutes);
app.use('/api/vocabulary', authenticate, vocabularyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
