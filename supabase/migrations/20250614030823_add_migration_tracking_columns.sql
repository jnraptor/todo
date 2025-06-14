-- Migration to add columns for improved todo persistence across authentication states
-- This migration adds tracking for device-to-user migrations

-- Add new columns to todos table
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS migrated_to_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS original_device_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_device_migration ON todos(device_id, migrated_to_user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_device ON todos(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_todos_migration_status ON todos(migrated_to_user_id, migration_timestamp);

-- Add comments to document the migration
COMMENT ON COLUMN todos.migrated_to_user_id IS 'Tracks which user account device todos were migrated to';
COMMENT ON COLUMN todos.migration_timestamp IS 'When the todo was migrated from device to user account';
COMMENT ON COLUMN todos.original_device_id IS 'Original device ID for todos migrated to user accounts';;
