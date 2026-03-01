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
import { setsRouter } from './routes/sets';
import { adminRouter } from './routes/admin';
import { webhooksRouter } from './routes/webhooks/stripe';
import ebayRouter from './routes/ebay';
import { startNightlySync, runNightlySync, syncPrices } from './cron/nightlySync';

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

app.use(express.json());
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
app.use('/api/sets', setsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/ebay', ebayRouter);

// Dev-only: manual sync trigger (async — responds immediately, runs in background)
if (process.env.NODE_ENV !== 'production') {
  let syncStatus: { running: boolean; startedAt: string | null; result: any; error: string | null } = {
    running: false, startedAt: null, result: null, error: null
  };

  app.post('/api/dev/sync-prices', (req: Request, res: Response) => {
    if (syncStatus.running) {
      res.status(409).json({ success: false, error: 'Sync already running', startedAt: syncStatus.startedAt });
      return;
    }

    syncStatus = { running: true, startedAt: new Date().toISOString(), result: null, error: null };
    console.log('\n🔧 Manual price sync triggered via /api/dev/sync-prices');

    syncPrices()
      .then(result => { syncStatus.running = false; syncStatus.result = result; })
      .catch(err => { syncStatus.running = false; syncStatus.error = (err as Error).message; });

    res.status(202).json({ success: true, message: 'Sync started in background', startedAt: syncStatus.startedAt });
  });

  app.post('/api/dev/sync-nightly', (req: Request, res: Response) => {
    if (syncStatus.running) {
      res.status(409).json({ success: false, error: 'Sync already running', startedAt: syncStatus.startedAt });
      return;
    }

    syncStatus = { running: true, startedAt: new Date().toISOString(), result: null, error: null };
    console.log('\n🔧 Manual nightly sync triggered via /api/dev/sync-nightly');

    runNightlySync()
      .then(() => { syncStatus.running = false; syncStatus.result = { completed: true }; })
      .catch(err => { syncStatus.running = false; syncStatus.error = (err as Error).message; });

    res.status(202).json({ success: true, message: 'Nightly sync started in background', startedAt: syncStatus.startedAt });
  });

  app.get('/api/dev/sync-status', (req: Request, res: Response) => {
    res.json(syncStatus);
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
  
  if (process.env.NODE_ENV !== 'test') {
    startNightlySync();
  }
}

export default app;
