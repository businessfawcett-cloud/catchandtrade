import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import { authenticate } from '../../middleware/auth';

export const usersRouter = Router();

usersRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }
);

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }
      
      const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        include: {
          portfolios: {
            where: { isPublic: true },
            include: {
              items: {
                include: { card: true }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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

export default usersRouter;
