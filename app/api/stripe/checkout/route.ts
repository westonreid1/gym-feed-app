import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, stripe_customer_id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const { priceId } = await request.json();

    // Create or retrieve Stripe customer
    let customerId = business.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          business_id: business.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          business_id: business.id,
        },
      },
      metadata: {
        business_id: business.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

