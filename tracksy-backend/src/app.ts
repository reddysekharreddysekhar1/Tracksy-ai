import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const createApp = (): Express => {
  const app = express();

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
    })
  );

  // Large payload limit for base64 OCR receipt images
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API router mounted under /api
  app.use('/api', apiRouter);

  // Fallback Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Tracksy Expense Tracker Backend',
      version: '1.0.0',
      status: 'online',
      docs: '/api/health',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
