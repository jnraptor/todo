-- Migration table to track device->user migrations
CREATE TABLE device_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  todos_count INTEGER DEFAULT 0
);

-- Function to migrate todos from device to user
CREATE OR REPLACE FUNCTION migrate_device_todos(
  p_device_id TEXT,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Update todos ownership
  UPDATE todos 
  SET user_id = p_user_id, 
      device_id = NULL,
      updated_at = NOW()
  WHERE device_id = p_device_id;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  -- Log migration
  INSERT INTO device_migrations (device_id, user_id, todos_count)
  VALUES (p_device_id, p_user_id, migrated_count);
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
