-- ============================================================================
-- DATA MIGRATION SCRIPT
-- Run this AFTER the schema migration to migrate your existing Hayes Training data
-- ============================================================================

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual Supabase auth user ID
-- You can find this in Supabase Dashboard > Authentication > Users

-- Step 1: Create the Hayes Training business entry
-- Replace the owner_id with your actual user ID
DO $$
DECLARE
    new_business_id UUID;
    existing_owner_id UUID;
BEGIN
    -- Get the first user's ID (assuming you're the only/first user)
    -- If you have multiple users, specify the correct one
    SELECT id INTO existing_owner_id FROM auth.users LIMIT 1;
    
    IF existing_owner_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first, then run this migration.';
        RETURN;
    END IF;
    
    -- Check if business already exists
    IF EXISTS (SELECT 1 FROM public.businesses WHERE slug = 'hayes-training') THEN
        SELECT id INTO new_business_id FROM public.businesses WHERE slug = 'hayes-training';
        RAISE NOTICE 'Business already exists with ID: %', new_business_id;
    ELSE
        -- Create the business
        INSERT INTO public.businesses (name, slug, owner_id, type, tagline, external_link, external_link_text)
        VALUES (
            'Hayes Training Systems',
            'hayes-training',
            existing_owner_id,
            'gym',
            'Daily Workouts',
            'https://hayestrainingsystems.com/subscribe/',
            'Sign Up'
        )
        RETURNING id INTO new_business_id;
        
        RAISE NOTICE 'Created business with ID: %', new_business_id;
    END IF;
    
    -- Update existing status records to belong to this business
    UPDATE public.status 
    SET business_id = new_business_id 
    WHERE business_id IS NULL;
    
    RAISE NOTICE 'Updated status records';
    
    -- Update existing posts to belong to this business
    UPDATE public.posts 
    SET business_id = new_business_id 
    WHERE business_id IS NULL;
    
    RAISE NOTICE 'Updated posts records';
    
    -- Create profile for the user if it doesn't exist
    INSERT INTO public.profiles (id, email)
    SELECT id, email FROM auth.users WHERE id = existing_owner_id
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migration complete!';
END $$;

-- ============================================================================
-- VERIFY MIGRATION
-- Run these queries to verify everything migrated correctly
-- ============================================================================

-- Check businesses
-- SELECT * FROM public.businesses;

-- Check status records have business_id
-- SELECT * FROM public.status;

-- Check posts have business_id  
-- SELECT * FROM public.posts;

-- Check profiles
-- SELECT * FROM public.profiles;

