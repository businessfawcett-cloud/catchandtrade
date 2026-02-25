import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import Stripe from 'stripe';

export const webhooksRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

webhooksRouter.post(
  '/stripe',
  async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error`);
    }

    try {
      switch (event.type) {
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          if (account.charges_enabled) {
            await prisma.user.updateMany({
              where: { stripeAccountId: account.id },
              data: { isVerifiedSeller: true }
            });
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSuccess(paymentIntent);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentFailure(paymentIntent);
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      next(error);
    }
  }
);

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { listingId, buyerId, sellerId, amount, platformFee } = paymentIntent.metadata;
  
  if (!listingId || !buyerId) {
    console.error('Missing metadata in paymentIntent:', paymentIntent.id);
    return;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  });

  if (!listing) {
    console.error('Listing not found:', listingId);
    return;
  }

  const commissionPercent = listing.commissionPct || 8;
  const platformFeeNum = parseFloat(platformFee) || (listing.buyNowPrice * (commissionPercent / 100));
  const sellerPayout = listing.buyNowPrice - platformFeeNum;

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'SOLD' }
  });

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (seller?.stripeAccountId) {
    await stripe.transfers.create({
      amount: Math.round(sellerPayout * 100),
      currency: 'usd',
      destination: seller.stripeAccountId
    });
  }

  await prisma.order.create({
    data: {
      listingId: listing.id,
      buyerId: buyerId,
      sellerId: sellerId,
      amount: listing.buyNowPrice,
      platformFee: platformFeeNum,
      sellerPayout,
      stripePaymentIntentId: paymentIntent.id,
      status: 'PAID'
    }
  });
  
  console.log('Order created for listing:', listingId, 'buyer:', buyerId);
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
}

export default webhooksRouter;
