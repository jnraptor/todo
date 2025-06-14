# Supabase Database Changes Applied

## ✅ Database Schema Updates

### 1. User Profiles Table Created
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- ✅ Primary key references auth.users(id)
- ✅ Stores user profile information from OAuth providers
- ✅ Tracks provider (google/github)
- ✅ Automatic timestamps

### 2. Row Level Security (RLS) Policies

**User Profiles Table:**
- ✅ RLS enabled
- ✅ Users can view own profile
- ✅ Users can update own profile  
- ✅ Users can insert own profile

**Device Migrations Table:**
- ✅ RLS enabled (security fix)
- ✅ Users can view own device migrations
- ✅ Users can insert own device migrations

### 3. Authentication Trigger Function
```sql
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Features:**
- ✅ Automatically creates user profile on signup
- ✅ Extracts data from OAuth provider metadata
- ✅ Security hardened with fixed search_path

### 4. Database Trigger
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Features:**
- ✅ Fires automatically when new user signs up
- ✅ Creates corresponding user_profiles record

### 5. Performance Optimization
```sql
CREATE INDEX IF NOT EXISTS idx_device_migrations_user_id ON device_migrations(user_id);
```

**Features:**
- ✅ Optimizes queries for device migration lookups
- ✅ Improves performance for user-specific migrations

## 🔧 Environment Configuration

### Updated .env.local
```env
REACT_APP_SUPABASE_URL=https://caruatxhsdmimzxyoytf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_REDIRECT_URL=http://localhost:3000/auth/callback
```

## 🛡️ Security Improvements Applied

### 1. Row Level Security (RLS)
- ✅ **user_profiles**: Users can only access their own profile data
- ✅ **device_migrations**: Users can only access their own migration records
- ✅ **todos**: Already had RLS enabled (existing)

### 2. Function Security
- ✅ **handle_new_user**: Fixed search_path vulnerability
- ✅ Set to SECURITY DEFINER with explicit search_path

### 3. Database Policies
- ✅ Granular permissions (SELECT, INSERT, UPDATE)
- ✅ User isolation using auth.uid()
- ✅ Principle of least privilege

## 📊 Current Database Schema

### Tables Overview
1. **todos** (existing)
   - id, text, completed, created_at, updated_at, device_id, user_id
   - RLS enabled ✅

2. **device_migrations** (existing, updated)
   - id, device_id, user_id, migrated_at, todos_count
   - RLS enabled ✅ (newly added)

3. **user_profiles** (new)
   - id, email, full_name, avatar_url, provider, created_at, updated_at
   - RLS enabled ✅

### Relationships
- `todos.user_id` → `auth.users.id`
- `device_migrations.user_id` → `auth.users.id`
- `user_profiles.id` → `auth.users.id`

## 🚀 Ready for OAuth Setup

### Next Steps for Complete Setup
1. **Configure OAuth Providers in Supabase Dashboard:**
   - Enable Google OAuth provider
   - Enable GitHub OAuth provider
   - Set redirect URLs to: `https://caruatxhsdmimzxyoytf.supabase.co/auth/v1/callback`

2. **OAuth Provider Setup:**
   - Google Cloud Console: Create OAuth 2.0 credentials
   - GitHub: Create OAuth App
   - Copy Client IDs and Secrets to Supabase Dashboard

### Database is Ready ✅
- All required tables created
- Security policies implemented
- Triggers and functions configured
- Performance optimizations applied
- Environment variables configured

The database schema is now fully prepared for the authentication system to work seamlessly with Google and GitHub OAuth providers!

## 🔍 Verification Commands

To verify the setup, you can run these SQL queries in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name, rls_enabled 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';