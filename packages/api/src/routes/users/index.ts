import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import jwt from 'jsonwebtoken';

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const usersRouter = Router();

usersRouter.get(
  '/check-username',
  query('u').isString().notEmpty(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const username = req.query.u as string;
      
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });

      res.json({ available: !existing });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get(
  '/:username',
  query('u').isString().notEmpty(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const username = req.query.u as string;
      
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });

      res.json({ available: !existing });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { username, displayName, avatarId, isPublic, hideCollectionValue, country, twitterHandle, instagramHandle, tiktokHandle } = req.body;

      if (username) {
        const existing = await prisma.user.findFirst({
          where: { username: username.toLowerCase(), NOT: { id: userId } }
        });
        if (existing) {
          return res.status(409).json({ error: 'Username already taken' });
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(username && { username: username.toLowerCase() }),
          ...(displayName && { displayName }),
          ...(avatarId !== undefined && { avatarId }),
          ...(isPublic !== undefined && { isPublic }),
          ...(hideCollectionValue !== undefined && { hideCollectionValue }),
          ...(country !== undefined && { country }),
          ...(twitterHandle !== undefined && { twitterHandle: twitterHandle || null }),
          ...(instagramHandle !== undefined && { instagramHandle: instagramHandle || null }),
          ...(tiktokHandle !== undefined && { tiktokHandle: tiktokHandle || null }),
        }
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }
);
