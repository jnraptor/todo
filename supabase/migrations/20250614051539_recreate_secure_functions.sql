-- Recreate all functions with search_path security fixes

-- 1. Create is_valid_device_id function with search_path fix
CREATE OR REPLACE FUNCTION public.is_valid_device_id(device_id text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Device ID should be a valid UUID format or a reasonable length string
    IF device_id IS NULL OR length(device_id) < 10 OR length(device_id) > 100 THEN
        RETURN false;
    END IF;
    
    -- Check if it's a valid UUID format or alphanumeric string
    RETURN device_id ~ '^[a-zA-Z0-9-_]+$';
END;
$$;

-- 2. Create check_rate_limit function with search_path fix
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier text,
    p_action text,
    p_limit integer DEFAULT 10,
    p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    request_count integer;
BEGIN
    -- Count requests in the time window
    SELECT COUNT(*)
    INTO request_count
    FROM public.rate_limits
    WHERE identifier = p_identifier
      AND action = p_action
      AND timestamp > (now() - (p_window_minutes || ' minutes')::interval);
    
    -- If under limit, record this request and allow
    IF request_count < p_limit THEN
        INSERT INTO public.rate_limits (identifier, action, timestamp)
        VALUES (p_identifier, p_action, now());
        RETURN true;
    END IF;
    
    -- Over limit, deny
    RETURN false;
END;
$$;

-- 3. Create cleanup_rate_limits function with search_path fix
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Delete rate limit records older than 24 hours
    DELETE FROM public.rate_limits
    WHERE timestamp < (now() - interval '24 hours');
END;
$$;

-- 4. Create update_updated_at_column function with search_path fix
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 5. Create audit_trigger_function with search_path fix
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    current_user_id uuid;
    current_device_id text;
BEGIN
    -- Get current user ID from auth context
    current_user_id := auth.uid();
    
    -- Try to get device_id from the record being modified
    IF TG_OP = 'DELETE' THEN
        current_device_id := OLD.device_id;
    ELSE
        current_device_id := NEW.device_id;
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
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
        current_user_id,
        current_device_id,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) - to_jsonb(OLD)
            ELSE NULL
        END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$;;
