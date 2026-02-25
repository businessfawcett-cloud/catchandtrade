import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';
import { Condition, ListingStatus } from '@prisma/client';
import Stripe from 'stripe';

export const listingsRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

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
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

listingsRouter.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('cardId').optional().isString(),
    query('condition').optional().isIn(['MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED']),
    query('isGraded').optional().isBoolean(),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'created_desc'])
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where: any = { status: 'ACTIVE' };

      if (req.query.cardId) where.cardId = req.query.cardId;
      if (req.query.condition) where.condition = req.query.condition;
      if (req.query.isGraded) where.isGraded = req.query.isGraded === 'true';

      let orderBy: any = { createdAt: 'desc' };
      if (req.query.sort === 'price_asc') orderBy = { buyNowPrice: 'asc' };
      if (req.query.sort === 'price_desc') orderBy = { buyNowPrice: 'desc' };
      if (req.query.sort === 'created_desc') orderBy = { createdAt: 'desc' };

      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            card: true,
            seller: { select: { id: true, displayName: true, avatarUrl: true } }
          }
        }),
        prisma.listing.count({ where })
      ]);

      res.json({
        listings,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

listingsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        card: true,
        seller: { select: { id: true, displayName: true, avatarUrl: true, isVerifiedSeller: true } }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    next(error);
  }
});

listingsRouter.post(
  '/',
  authenticate,
  [
    body('cardId').notEmpty(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('condition').isIn(['MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED']),
    body('isGraded').optional().isBoolean(),
    body('gradeCompany').optional().isString(),
    body('gradeValue').optional().isFloat({ min: 0, max: 10 }),
    body('buyNowPrice').isFloat({ min: 0.01 }),
    body('imageUrls').isArray({ min: 1 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user?.isVerifiedSeller) {
        return res.status(403).json({ error: 'Only verified sellers can create listings' });
      }

      const { 
        cardId, 
        title, 
        description, 
        condition, 
        isGraded = false,
        gradeCompany,
        gradeValue,
        buyNowPrice,
        imageUrls 
      } = req.body;

      if (gradeValue !== undefined && (gradeValue < 0 || gradeValue > 10)) {
        return res.status(400).json({ error: 'Grade value must be between 0 and 10' });
      }

      const listing = await prisma.listing.create({
        data: {
          sellerId: user.id,
          cardId,
          title,
          description,
          condition: condition as Condition,
          isGraded,
          gradeCompany,
          gradeValue,
          buyNowPrice,
          imageUrls,
          status: 'ACTIVE' as ListingStatus,
          commissionPct: 8
        }
      });

      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  }
);

listingsRouter.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.sellerId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.listing.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

listingsRouter.post(
  '/:id/purchase',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: req.params.id },
        include: { card: true, seller: true }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Listing is not available' });
      }

      const buyerId = (req as any).userId;
      if (listing.sellerId === buyerId) {
        return res.status(400).json({ error: 'Cannot purchase your own listing' });
      }

      const commissionPercent = listing.commissionPct || 8;
      const platformFee = listing.buyNowPrice * (commissionPercent / 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(listing.buyNowPrice * 100),
        currency: 'usd',
        metadata: {
          listingId: listing.id,
          buyerId,
          sellerId: listing.sellerId,
          amount: listing.buyNowPrice.toString(),
          platformFee: platformFee.toString()
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.buyNowPrice
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default listingsRouter;
