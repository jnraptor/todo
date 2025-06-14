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

-- Update RLS policies to handle the new migration system

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Device todos are viewable by device" ON todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are insertable by device" ON todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are updatable by device" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are deletable by device" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;

-- Create new RLS policies for SELECT
CREATE POLICY "Device todos are viewable by device" ON todos
    FOR SELECT USING (
        auth.uid() IS NULL 
        AND device_id = current_setting('app.device_id', true)
        AND migrated_to_user_id IS NULL
    );

CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Create new RLS policies for INSERT
CREATE POLICY "Device todos are insertable by device" ON todos
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL 
        AND device_id = current_setting('app.device_id', true)
        AND user_id IS NULL
    );

CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND device_id IS NULL
    );

-- Create new RLS policies for UPDATE
CREATE POLICY "Device todos are updatable by device" ON todos
    FOR UPDATE USING (
        auth.uid() IS NULL 
        AND device_id = current_setting('app.device_id', true)
        AND migrated_to_user_id IS NULL
    );

CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Create new RLS policies for DELETE
CREATE POLICY "Device todos are deletable by device" ON todos
    FOR DELETE USING (
        auth.uid() IS NULL 
        AND device_id = current_setting('app.device_id', true)
        AND migrated_to_user_id IS NULL
    );

CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Remove the old migrate_device_todos function if it exists
DROP FUNCTION IF EXISTS migrate_device_todos(text, uuid);

-- Create a comment to document the migration
COMMENT ON COLUMN todos.migrated_to_user_id IS 'Tracks which user account device todos were migrated to';
COMMENT ON COLUMN todos.migration_timestamp IS 'When the todo was migrated from device to user account';
COMMENT ON COLUMN todos.original_device_id IS 'Original device ID for todos migrated to user accounts';