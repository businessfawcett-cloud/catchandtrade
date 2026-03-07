import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Log auth header for debugging (strip sensitive token data)
  console.log('Auth header present:', !!authHeader);
  console.log('Auth header format:', authHeader?.startsWith('Bearer ') ? 'Valid Bearer format' : 'Invalid or missing Bearer format');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Authentication failed: Missing or malformed Authorization header');
    return res.status(401).json({ 
      error: 'Unauthorized',
      details: 'Missing or malformed Authorization header. Expected format: "Bearer <token>"'
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted from header (first 10 chars):', token?.substring(0, 10) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('Token verified successfully for user:', decoded.userId);
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    const error = err as Error;
    console.log('JWT verification failed:', error.message);
    
    let errorType = 'Invalid token';
    let statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
      errorType = 'Token expired';
      statusCode = 401;
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'Invalid token signature';
      statusCode = 401;
    } else if (error.name === 'NotBeforeError') {
      errorType = 'Token not active yet';
      statusCode = 401;
    }
    
    return res.status(statusCode).json({ 
      error: errorType,
      details: error.message
    });
  }
};