import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const SECRET = JWT_SECRET || 'test-jwt-secret';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH] Missing or malformed Authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('[AUTH] Token decoded successfully:', decoded);
    
    if (!decoded || typeof decoded !== 'object') {
      console.log('[AUTH] Invalid token payload - not an object');
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    const tokenData = decoded as Record<string, unknown>;
    if (typeof tokenData.userId !== 'string') {
      console.log('[AUTH] Invalid token payload - userId not a string:', tokenData);
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    (req as any).userId = tokenData.userId;
    next();
  } catch (err) {
    const error = err as Error;
    console.log('[AUTH] JWT verification failed:', error.message);

    let errorType = 'Invalid token';
    if (error.name === 'TokenExpiredError') {
      errorType = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'Invalid token signature';
    } else if (error.name === 'NotBeforeError') {
      errorType = 'Token not active yet';
    }

    return res.status(401).json({ error: errorType });
  }
};
