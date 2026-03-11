import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '@catchandtrade/db';
import { User } from '@prisma/client';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

const WEB_URL = process.env.WEB_URL || (process.env.NODE_ENV === 'production' ? 'https://catchandtrade.com' : 'http://localhost:3002');

const generateTokens = (user: { id: string; email: string }) => {
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

const passwordValidation = (password: string): boolean => {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password must be at least 8 characters with 1 uppercase letter and 1 number');
  }
  return true;
};

authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').custom(passwordValidation).withMessage('Password must be at least 8 characters with 1 uppercase letter and 1 number'),
    body('displayName').optional().trim().isLength({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, displayName } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: displayName || email.split('@')[0]
        }
      });

      await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: 'My Portfolio'
        }
      });

      const { token, refreshToken } = generateTokens(user);

      const { passwordHash: _, ...userWithoutPassword } = user;

      res.status(201).json({ token, refreshToken, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { token, refreshToken } = generateTokens(user);

      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({ token, refreshToken, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
);

const isGoogleConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

const isAppleConfigured = () => {
  return !!process.env.APPLE_CLIENT_ID;
};

authRouter.get(
  '/google',
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleConfigured()) {
      return res.status(400).json({ error: 'Google OAuth not configured' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response) => {
    const token = jwt.sign(
      { userId: (req.user as User).id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.redirect(`${WEB_URL}/callback?token=${token}`);
  }
);

authRouter.get(
  '/apple',
  (req: Request, res: Response, next: NextFunction) => {
    if (!isAppleConfigured()) {
      return res.status(400).json({ error: 'Apple OAuth not configured' });
    }
    passport.authenticate('apple', { scope: ['name', 'email'] })(req, res, next);
  }
);

authRouter.post(
  '/apple/callback',
  passport.authenticate('apple', { session: false }),
  (req: Request, res: Response) => {
    const token = jwt.sign(
      { userId: (req.user as User).id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.redirect(`${WEB_URL}/callback?token=${token}`);
  }
);

// Mobile Google Sign-In: accepts Google access token, verifies with Google, returns JWT
authRouter.post(
  '/google/mobile',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: 'Missing accessToken' });
      }

      // Verify the access token with Google's userinfo endpoint
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!googleRes.ok) {
        return res.status(401).json({ error: 'Invalid Google access token' });
      }

      const profileData = await googleRes.json();
      const profile = profileData as { sub: string; email: string; name?: string; picture?: string };
      const googleId = profile.sub;
      const email = profile.email;
      const displayName = profile.name || 'Google User';
      const avatarUrl = profile.picture || null;

      if (!googleId) {
        return res.status(401).json({ error: 'Could not verify Google identity' });
      }

      // Find or create user (same logic as passport strategy)
      let user = await prisma.user.findUnique({ where: { googleId } });

      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId,
            email: email || `google_${googleId}@noemail.local`,
            displayName,
            avatarUrl,
          },
        });
        await prisma.portfolio.create({
          data: { userId: user.id, name: 'My Portfolio' },
        });
      }

      const { token, refreshToken } = generateTokens(user);
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({ token, refreshToken, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh - Refresh access token using refresh token
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verify refresh token
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
      } catch {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Generate new tokens
      const { token: newToken, refreshToken: newRefreshToken } = generateTokens(user);
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({ token: newToken, refreshToken: newRefreshToken, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;
