import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeWebhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    
    let event;
    try {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', stripeWebhookSecret)
        .update(body)
        .digest('hex');
      
      const providedSignature = signature?.replace('v1=', '');
      
      if (expectedSignature !== providedSignature) {
        console.error('Invalid Stripe signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
      
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing Stripe event:', parseError);
      return NextResponse.json({ error: 'Parse error' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const listingId = session.metadata?.listingId;
        
        if (userId && listingId) {
          await supabase
            .from('Order')
            .update({ status: 'PAID', stripepaymentid: session.payment_intent })
            .eq('listingid', listingId)
            .eq('buyerid', userId);
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }
      
      default:
        console.log('Unhandled Stripe event type:', event.type);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
