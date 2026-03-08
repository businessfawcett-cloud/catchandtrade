import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import './config/passport';
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
import gradingRouter from './routes/grading';
import ebayRouter from './routes/ebay';
import { debugRouter } from './routes/debug';
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

// Debug middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', {
    'origin': req.headers.origin,
    'authorization': req.headers.authorization ? `${req.headers.authorization.substring(0, 15)}...` : 'MISSING',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  next();
});

app.use(cors({ 
  origin: CORS_ORIGINS,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '2.0.3' });
});

app.get('/debug', (req: Request, res: Response) => {
  res.json({ 
    jwtSecret: process.env.JWT_SECRET ? 'set' : 'not set',
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.API_URL
  });
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
app.use('/api/grading', gradingRouter);
app.use('/api/debug', debugRouter);

// Public cron endpoint for UptimeRobot - triggers nightly sync
const CRON_SECRET = process.env.CRON_SECRET;

let cronSyncStatus = { running: false, startedAt: null as string | null };

app.get('/api/cron/sync', async (req: Request, res: Response) => {
  const token = req.query.token as string;
  
  if (!token || token !== CRON_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }
  
  // Check 24-hour rate limit
  const lastSync = await prisma.syncLog.findFirst({ orderBy: { runAt: 'desc' } });
  if (lastSync) {
    const hoursSince = (Date.now() - lastSync.runAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return res.status(429).json({
        error: 'Sync can only run once every 24 hours',
        nextAvailableAt: new Date(lastSync.runAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  // Start sync in background
  cronSyncStatus = { running: true, startedAt: new Date().toISOString() };
  console.log('\n⏰ Cron price sync triggered via /api/cron/sync');
  
  runNightlySync()
    .then(() => { cronSyncStatus.running = false; console.log('✅ Cron nightly sync completed'); })
    .catch(err => { cronSyncStatus.running = false; console.error('❌ Cron nightly sync failed:', err); });
  
  res.status(200).json({ success: true, message: 'Sync started', timestamp: new Date().toISOString() });
});

// Public status endpoint for cron sync
app.get('/api/cron/status', async (req: Request, res: Response) => {
  const lastSync = await prisma.syncLog.findFirst({ orderBy: { runAt: 'desc' } });
  
  let nextAvailableAt = null;
  if (lastSync) {
    const hoursSince = (Date.now() - lastSync.runAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      nextAvailableAt = new Date(lastSync.runAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }
  
  res.json({
    running: cronSyncStatus.running,
    lastRunAt: lastSync?.runAt?.toISOString() || null,
    nextAvailableAt
  });
});

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
