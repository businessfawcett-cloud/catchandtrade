import { Router, Request, Response } from 'express';

export const debugRouter = Router();

debugRouter.get('/auth-test', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  res.json({
    timestamp: new Date().toISOString(),
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      API_URL: process.env.API_URL
    },
    headers: {
      authorization: authHeader ? `Bearer ${authHeader.substring(0, 10)}...` : 'MISSING'
    }
  });
});

debugRouter.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});