-- ============================================================================
-- MULTI-TENANT MIGRATION SCRIPT
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- STEP 1: Create the businesses table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    type TEXT NOT NULL DEFAULT 'gym', -- 'gym', 'barber', 'food_truck', etc.
    primary_color TEXT DEFAULT '#22c55e', -- Accent color for theming
    tagline TEXT, -- Short description like "Daily Workouts"
    external_link TEXT, -- e.g., sign-up link
    external_link_text TEXT DEFAULT 'Sign Up', -- Button text
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast slug lookups (this is how public pages load)
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);

-- ============================================================================
-- STEP 2: Create profiles table to link users to their businesses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Rename existing tables and add business_id
-- ============================================================================

-- Rename gym_status to status (more generic for multi-tenant)
ALTER TABLE IF EXISTS public.gym_status RENAME TO status;

-- Add business_id to status table
ALTER TABLE public.status 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Add business_id to posts table  
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Create indexes for business_id lookups
CREATE INDEX IF NOT EXISTS idx_status_business ON public.status(business_id);
CREATE INDEX IF NOT EXISTS idx_posts_business ON public.posts(business_id);

-- ============================================================================
-- STEP 4: Create function to auto-create profile on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: Create function to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 6: Enable Row Level Security on all tables
-- ============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: RLS Policies for BUSINESSES table
-- ============================================================================

-- Anyone can read business info (needed for public pages)
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
CREATE POLICY "Public can view businesses" ON public.businesses
    FOR SELECT
    USING (true);

-- Only authenticated users can create a business (and become owner)
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
CREATE POLICY "Authenticated users can create businesses" ON public.businesses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Only the owner can update their business
DROP POLICY IF EXISTS "Owners can update their business" ON public.businesses;
CREATE POLICY "Owners can update their business" ON public.businesses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Only the owner can delete their business
DROP POLICY IF EXISTS "Owners can delete their business" ON public.businesses;
CREATE POLICY "Owners can delete their business" ON public.businesses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ============================================================================
-- STEP 8: RLS Policies for PROFILES table
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 9: RLS Policies for STATUS table
-- ============================================================================

-- Anyone can read status for any business (public pages need this)
DROP POLICY IF EXISTS "Public can view status" ON public.status;
CREATE POLICY "Public can view status" ON public.status
    FOR SELECT
    USING (true);

-- Only the business owner can insert status for their business
DROP POLICY IF EXISTS "Owners can insert status" ON public.status;
CREATE POLICY "Owners can insert status" ON public.status
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Only the business owner can update status for their business
DROP POLICY IF EXISTS "Owners can update status" ON public.status;
CREATE POLICY "Owners can update status" ON public.status
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Only the business owner can delete status for their business
DROP POLICY IF EXISTS "Owners can delete status" ON public.status;
CREATE POLICY "Owners can delete status" ON public.status
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 10: RLS Policies for POSTS table
-- ============================================================================

-- Anyone can read posts for any business (public pages need this)
DROP POLICY IF EXISTS "Public can view posts" ON public.posts;
CREATE POLICY "Public can view posts" ON public.posts
    FOR SELECT
    USING (true);

-- Only the business owner can insert posts for their business
DROP POLICY IF EXISTS "Owners can insert posts" ON public.posts;
CREATE POLICY "Owners can insert posts" ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Only the business owner can update posts for their business
DROP POLICY IF EXISTS "Owners can update posts" ON public.posts;
CREATE POLICY "Owners can update posts" ON public.posts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Only the business owner can delete posts for their business
DROP POLICY IF EXISTS "Owners can delete posts" ON public.posts;
CREATE POLICY "Owners can delete posts" ON public.posts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE businesses.id = business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 11: Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT SELECT ON public.status TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.status TO authenticated;
GRANT ALL ON public.posts TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE!
-- 
-- Next Steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. If you have existing data, run the data migration script below
-- ============================================================================

