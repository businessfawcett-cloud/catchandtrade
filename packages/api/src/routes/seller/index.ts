import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';
import Stripe from 'stripe';

export const sellerRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

sellerRouter.post(
  '/onboard',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      let user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.stripeAccountId) {
        const accountLink = await stripe.accountLinks.create({
          account: user.stripeAccountId,
          refresh_url: `${process.env.WEB_URL}/seller/reauth`,
          return_url: `${process.env.WEB_URL}/seller/complete`,
          type: 'account_onboarding'
        });

        return res.json({ onboardingUrl: accountLink.url });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });

      user = await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: account.id }
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.WEB_URL}/seller/reauth`,
        return_url: `${process.env.WEB_URL}/seller/complete`,
        type: 'account_onboarding'
      });

      res.json({ onboardingUrl: accountLink.url });
    } catch (error) {
      next(error);
    }
  }
);

sellerRouter.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        isVerifiedSeller: user.isVerifiedSeller,
        hasStripeAccount: !!user.stripeAccountId
      });
    } catch (error) {
      next(error);
    }
  }
);

export default sellerRouter;
