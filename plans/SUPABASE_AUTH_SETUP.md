# Supabase Authentication Setup Guide

This guide walks you through setting up Google and GitHub OAuth authentication for the Todo App using Supabase Auth.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Google Cloud Console project for Google OAuth
3. GitHub OAuth App for GitHub authentication

## Step 1: Configure OAuth Providers

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen
6. Set authorized redirect URIs:
   - Development: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Production: `https://[your-project-ref].supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret

## Step 2: Configure Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Enable Google Provider:
   - Paste your Google Client ID
   - Paste your Google Client Secret
4. Enable GitHub Provider:
   - Paste your GitHub Client ID
   - Paste your GitHub Client Secret

## Step 3: Database Schema Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add user profile table for additional user data
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read/update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add index for migration tracking
CREATE INDEX idx_device_migrations_user_id ON device_migrations(user_id);
```

## Step 4: Environment Variables

Create a `.env.local` file in your project root:

```env
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_REDIRECT_URL=http://localhost:3000/auth/callback
```

For production, update `REACT_APP_REDIRECT_URL` to your production domain.

## Step 5: Test the Implementation

1. Start your development server: `npm start`
2. Create a few todos to trigger the auth prompt
3. Click "Create Account" to test the OAuth flow
4. Verify that:
   - OAuth providers redirect correctly
   - User profile is created in the database
   - Todos are migrated from anonymous to authenticated user
   - User can sign out and sign back in

## Features Implemented

### Authentication Flow
- ✅ Google OAuth integration
- ✅ GitHub OAuth integration
- ✅ Anonymous to authenticated user migration
- ✅ Session management with auto-refresh
- ✅ Secure redirect handling

### UI Components
- ✅ AuthModal with provider buttons
- ✅ UserProfile dropdown with sign out
- ✅ AuthCallback loading screen
- ✅ Updated AuthPrompt integration

### Security Features
- ✅ Row Level Security (RLS) policies
- ✅ Secure session storage
- ✅ CSRF protection via OAuth state parameter
- ✅ Environment variable validation

### Data Migration
- ✅ Automatic todo migration on sign-in
- ✅ Device ID cleanup after migration
- ✅ Offline queue processing for authenticated users

## Troubleshooting

### Common Issues

1. **OAuth redirect mismatch**
   - Ensure redirect URLs match exactly in OAuth provider settings
   - Check that Supabase project URL is correct

2. **Environment variables not loading**
   - Restart development server after adding `.env.local`
   - Ensure variables start with `REACT_APP_`

3. **Database permission errors**
   - Verify RLS policies are correctly applied
   - Check that user_profiles table exists

4. **Migration not working**
   - Check browser console for migration errors
   - Verify device_migrations table has proper indexes

### Testing OAuth Locally

For local testing, you may need to:
1. Use `localhost:3000` in OAuth provider settings
2. Ensure your Supabase project allows localhost redirects
3. Test with different browsers to verify session isolation

## Production Deployment

Before deploying to production:

1. Update OAuth provider redirect URLs to production domain
2. Set production environment variables
3. Test OAuth flow in staging environment
4. Verify RLS policies work with real user data
5. Monitor authentication logs in Supabase dashboard

## Security Considerations

- Never commit `.env.local` to version control
- Use HTTPS in production
- Regularly rotate OAuth client secrets
- Monitor authentication logs for suspicious activity
- Implement rate limiting for auth endpoints if needed