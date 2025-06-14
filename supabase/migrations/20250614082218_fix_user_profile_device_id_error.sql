-- ============================================
-- FIX USER PROFILE DEVICE_ID ERROR
-- ============================================
-- This migration fixes the "Database error saving new user" issue
-- by ensuring the handle_new_user() function doesn't reference device_id

-- First, let's check the current handle_new_user function and recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function without any device_id references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile with better error handling and null checks
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    COALESCE(new.raw_app_meta_data->>'provider', 'unknown')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Add comment to document the function
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on auth.users insert - handles errors gracefully';

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the user_profiles table has the correct structure
-- Add NOT NULL constraint on email if it doesn't exist
DO $$
BEGIN
  -- Check if email column allows NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email' 
    AND is_nullable = 'YES'
  ) THEN
    -- Update any existing NULL emails to empty string
    UPDATE public.user_profiles SET email = '' WHERE email IS NULL;
    
    -- Add NOT NULL constraint
    ALTER TABLE public.user_profiles 
    ALTER COLUMN email SET NOT NULL;
    
    -- Add constraint name for documentation
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT email_not_null CHECK (email IS NOT NULL);
  END IF;
END $$;

-- Add comment to document the constraint
COMMENT ON CONSTRAINT email_not_null ON public.user_profiles IS 'Ensures email is never null, empty string is allowed';;
