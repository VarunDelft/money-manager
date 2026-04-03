import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import tagRoutes from './routes/tags';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());
  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  }));

  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/transactions', transactionRoutes);
  app.use('/api/v1/tags', tagRoutes);

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}

// Development server entry point
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const app = createApp();
  app.listen(port, () => {
    console.warn(`Backend running on http://localhost:${port}`);
  });
}
