-- Add Stripe subscription columns to businesses table
-- Run this in Supabase SQL Editor

-- Add Stripe-related columns
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Set trial_ends_at for existing businesses (14 days from now)
UPDATE businesses 
SET trial_ends_at = NOW() + INTERVAL '14 days',
    subscription_status = 'trialing'
WHERE trial_ends_at IS NULL;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer 
ON businesses(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status 
ON businesses(subscription_status);

