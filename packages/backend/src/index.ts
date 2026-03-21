import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import cors from 'cors';
import express from 'express';
import pg from 'pg';

import { PrismaClient } from '../prisma/generated/client';
import { errorHandler } from './middleware/error-handler';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';
import seedRouter from './routes/seed';

const app = express();
const port = process.env.PORT || 3000;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api', analyticsRouter);
app.use('/api/admin/seed', seedRouter);

// Error handling
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
