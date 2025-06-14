-- Add index for migration tracking
CREATE INDEX IF NOT EXISTS idx_device_migrations_user_id ON device_migrations(user_id);;
