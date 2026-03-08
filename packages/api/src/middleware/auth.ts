import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const SECRET = JWT_SECRET || 'test-jwt-secret';

const isDev = process.env.NODE_ENV !== 'production';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) console.log('Authentication failed: Missing or malformed Authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    const error = err as Error;
    if (isDev) console.log('JWT verification failed:', error.message);

    let errorType = 'Invalid token';
    if (error.name === 'TokenExpiredError') {
      errorType = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'Invalid token';
    } else if (error.name === 'NotBeforeError') {
      errorType = 'Token not active yet';
    }

    return res.status(401).json({ error: errorType });
  }
};
