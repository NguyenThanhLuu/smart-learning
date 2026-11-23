import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFound } from './middleware/errors.js';
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

app.get('/api/health', (_request, response) => {
  response.json({
    data: {
      status: 'ok',
      database:
        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/articles', authenticate, articleRoutes);
app.use('/api/vocabulary', authenticate, vocabularyRoutes);

app.use(notFound);
app.use(errorHandler);
