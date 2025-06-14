-- ============================================
-- ENHANCED SECURITY MIGRATION FOR TODO APP (V2)
-- ============================================
-- Version: 1.0.2
-- Date: 2025-01-15
-- Description: Comprehensive security enhancements including:
--   - Strengthened RLS policies with field-level restrictions
--   - Device ID validation (supports existing format)
--   - Rate limiting infrastructure
--   - Audit logging
--   - Security helper functions
-- ============================================

-- Start transaction
BEGIN;

-- ============================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 2: VALIDATION FUNCTIONS
-- ============================================

-- Function to validate device ID format (supports both UUID and device_UUID formats)
CREATE OR REPLACE FUNCTION is_valid_device_id(device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Device ID should be either:
    -- 1. Pure UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    -- 2. Device prefixed format: device_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    RETURN device_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OR device_id ~ '^device_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to validate device IDs
ALTER TABLE todos DROP CONSTRAINT IF EXISTS valid_device_id;
ALTER TABLE todos ADD CONSTRAINT valid_device_id 
    CHECK (device_id IS NULL OR is_valid_device_id(device_id));

-- ============================================
-- SECTION 3: DROP EXISTING POLICIES
-- ============================================

-- Drop all existing todo policies
DROP POLICY IF EXISTS "Device todos are viewable by device" ON todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are insertable by device" ON todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are updatable by device" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Device todos are deletable by device" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;
DROP POLICY IF EXISTS "Service role can migrate todos" ON todos;

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create user profiles" ON user_profiles;

-- ============================================
-- SECTION 4: ENHANCED TODO RLS POLICIES
-- ============================================

-- SELECT Policies
CREATE POLICY "Device todos are viewable by device" ON todos
    FOR SELECT USING (
        auth.uid() IS NULL 
        AND device_id IS NOT NULL
        AND device_id = current_setting('request.headers', true)::json->>'x-device-id'
        AND migrated_to_user_id IS NULL
        AND user_id IS NULL
    );

CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND device_id IS NULL
    );

-- INSERT Policies with field restrictions
CREATE POLICY "Device todos are insertable by device" ON todos
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL 
        AND device_id IS NOT NULL
        AND device_id = current_setting('request.headers', true)::json->>'x-device-id'
        AND user_id IS NULL
        AND migrated_to_user_id IS NULL
        AND migration_timestamp IS NULL
        AND original_device_id IS NULL
    );

CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND device_id IS NULL
        AND migrated_to_user_id IS NULL
        AND migration_timestamp IS NULL
        AND original_device_id IS NULL
    );

-- UPDATE Policies (simplified - focus on ownership)
CREATE POLICY "Device todos are updatable by device" ON todos
    FOR UPDATE USING (
        auth.uid() IS NULL 
        AND device_id IS NOT NULL
        AND device_id = current_setting('request.headers', true)::json->>'x-device-id'
        AND migrated_to_user_id IS NULL
        AND user_id IS NULL
    );

CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
    );

-- DELETE Policies
CREATE POLICY "Device todos are deletable by device" ON todos
    FOR DELETE USING (
        auth.uid() IS NULL 
        AND device_id IS NOT NULL
        AND device_id = current_setting('request.headers', true)::json->>'x-device-id'
        AND migrated_to_user_id IS NULL
        AND user_id IS NULL
    );

CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
    );

-- Service role policy for migrations
CREATE POLICY "Service role can migrate todos" ON todos
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- ============================================
-- SECTION 5: ENHANCED USER_PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id
    );

CREATE POLICY "System can create user profiles" ON user_profiles
    FOR INSERT WITH CHECK (
        -- Only allow inserts through the trigger or service role
        auth.uid() = id
        OR auth.role() = 'service_role'
    );

-- ============================================
-- SECTION 6: RATE LIMITING INFRASTRUCTURE
-- ============================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (identifier, action, timestamp)
);

-- Create index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limit policies (only service role can manage)
CREATE POLICY "Service role manages rate limits" ON rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_window_minutes INT DEFAULT 5,
    p_max_requests INT DEFAULT 100
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INT;
BEGIN
    -- Count recent requests
    SELECT COUNT(*) INTO request_count
    FROM rate_limits
    WHERE identifier = p_identifier
    AND action = p_action
    AND timestamp > NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    -- Check if limit exceeded
    IF request_count >= p_max_requests THEN
        RAISE EXCEPTION 'Rate limit exceeded for % on action %', p_identifier, p_action;
        RETURN FALSE;
    END IF;
    
    -- Log this request
    INSERT INTO rate_limits (identifier, action)
    VALUES (p_identifier, p_action);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits
    WHERE timestamp < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 7: AUDIT LOGGING
-- ============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    device_id TEXT,
    row_data JSONB,
    changed_fields JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action ON audit_logs(table_name, action);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Only system can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

-- Enhanced audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    headers_json JSONB;
    ip_addr INET;
    user_agent_str TEXT;
BEGIN
    -- Get request headers safely
    BEGIN
        headers_json := current_setting('request.headers', true)::jsonb;
        ip_addr := (headers_json->>'x-forwarded-for')::INET;
        user_agent_str := headers_json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        headers_json := '{}'::jsonb;
        ip_addr := NULL;
        user_agent_str := NULL;
    END;

    -- Insert audit log
    INSERT INTO audit_logs (
        table_name,
        action,
        user_id,
        device_id,
        row_data,
        changed_fields,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        headers_json->>'x-device-id',
        CASE 
            WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
            ELSE row_to_json(NEW)
        END,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN 
                (SELECT jsonb_object_agg(key, value) 
                 FROM jsonb_each(row_to_json(NEW)::jsonb) 
                 WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb)->key)
            ELSE NULL
        END,
        ip_addr,
        user_agent_str
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_todos_changes ON todos;
CREATE TRIGGER audit_todos_changes
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_profiles_changes ON user_profiles;
CREATE TRIGGER audit_user_profiles_changes
    AFTER UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- SECTION 8: SECURITY HELPER FUNCTIONS
-- ============================================

-- Function to check if a user owns a todo
CREATE OR REPLACE FUNCTION user_owns_todo(todo_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM todos 
        WHERE id = todo_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's todo count
CREATE OR REPLACE FUNCTION get_user_todo_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM todos 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- SECTION 9: SCHEDULED CLEANUP
-- ============================================

-- Create a function to be called by pg_cron for cleanup
CREATE OR REPLACE FUNCTION scheduled_cleanup()
RETURNS void AS $$
BEGIN
    -- Clean up old rate limits
    PERFORM cleanup_rate_limits();
    
    -- Clean up old audit logs (keep 90 days)
    DELETE FROM audit_logs
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Clean up orphaned device todos (older than 30 days with no activity)
    DELETE FROM todos
    WHERE device_id IS NOT NULL
    AND user_id IS NULL
    AND created_at < NOW() - INTERVAL '30 days'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 10: SECURITY VIEWS
-- ============================================

-- Create a view for users to see their security events
CREATE OR REPLACE VIEW my_security_events AS
SELECT 
    timestamp,
    action,
    table_name,
    changed_fields,
    ip_address,
    user_agent
FROM audit_logs
WHERE user_id = auth.uid()
ORDER BY timestamp DESC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON my_security_events TO authenticated;

-- ============================================
-- SECTION 11: FINAL SECURITY CHECKS
-- ============================================

-- Ensure all tables have RLS enabled
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('todos', 'user_profiles', 'rate_limits', 'audit_logs')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = r.tablename 
            AND relrowsecurity = true
        ) THEN
            RAISE EXCEPTION 'RLS not enabled on table %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- Commit transaction
COMMIT;;
