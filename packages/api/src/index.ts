import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import { prisma } from '@catchandtrade/db';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { pricingRouter } from './routes/pricing';
import { portfoliosRouter } from './routes/portfolios';
import { sellerRouter } from './routes/seller';
import { listingsRouter } from './routes/listings';
import { cardsRouter } from './routes/cards';
import { watchlistRouter } from './routes/watchlist';
import { alertsRouter } from './routes/alerts';
import { setsRouter } from './routes/sets';
import { adminRouter } from './routes/admin';
import { webhooksRouter } from './routes/webhooks/stripe';
import { startNightlySync } from './cron/nightlySync';

const PORT = process.env.PORT || 3003;

const CORS_ORIGINS = [
  'http://localhost:3002',
  'https://catchandtrade.com',
  'https://www.catchandtrade.com'
];
if (process.env.WEB_URL) {
  CORS_ORIGINS.push(process.env.WEB_URL);
}

export const app: Express = express();

app.use(cors({ origin: CORS_ORIGINS }));

app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let status = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
    status = 'degraded';
  }
  
  res.json({
    status,
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/portfolios', portfoliosRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/sets', setsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhooksRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
  
  if (process.env.NODE_ENV !== 'test') {
    startNightlySync();
  }
}

export default app;
