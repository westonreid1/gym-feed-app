import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase with the SERVICE_ROLE key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to safely get subscription dates
function getSubscriptionDates(subscription: Stripe.Subscription) {
  return {
    trialEnd: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    periodEnd: subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null,
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe signature or webhook secret');
    return NextResponse.json({ error: 'Configuration Error' }, { status: 400 });
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
    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      // 1. Initial Checkout Success
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.business_id;

        if (businessId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const dates = getSubscriptionDates(subscription);

          await supabaseAdmin
            .from('businesses')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              subscription_status: subscription.status,
              trial_ends_at: dates.trialEnd,
              subscription_ends_at: dates.periodEnd,
            })
            .eq('id', businessId);
        }
        break;
      }

      // 2. Subscription Updates (Renewals/Changes)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const dates = getSubscriptionDates(subscription);

        // Try metadata first
        let businessId = subscription.metadata?.business_id;

        if (businessId) {
            await supabaseAdmin
            .from('businesses')
            .update({
              subscription_status: subscription.status,
              trial_ends_at: dates.trialEnd,
              subscription_ends_at: dates.periodEnd,
            })
            .eq('id', businessId);
        } else {
            // Fallback: Find business by the Stripe Subscription ID
             await supabaseAdmin
            .from('businesses')
            .update({
              subscription_status: subscription.status,
              trial_ends_at: dates.trialEnd,
              subscription_ends_at: dates.periodEnd,
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      // 3. Subscription Cancellations
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('businesses')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null, 
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // 4. Payment Failed (Card Declined)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabaseAdmin
            .from('businesses')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_subscription_id', subscriptionId);
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
