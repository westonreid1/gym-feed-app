import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.business_id;
        
        if (businessId && session.subscription) {
          // Get subscription details
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const subscription = subscriptionResponse as Stripe.Subscription;
          
          await supabaseAdmin
            .from('businesses')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', businessId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.business_id;
        
        if (businessId) {
          await supabaseAdmin
            .from('businesses')
            .update({
              subscription_status: subscription.status,
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', businessId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.business_id;
        
        if (businessId) {
          await supabaseAdmin
            .from('businesses')
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', businessId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = subscriptionResponse as Stripe.Subscription;
          const businessId = subscription.metadata?.business_id;
          
          if (businessId) {
            await supabaseAdmin
              .from('businesses')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', businessId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
