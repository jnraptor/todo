-- Enable RLS on device_migrations table
ALTER TABLE device_migrations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for device_migrations
CREATE POLICY "Users can view own device migrations" ON device_migrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device migrations" ON device_migrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix function security by setting search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;;
