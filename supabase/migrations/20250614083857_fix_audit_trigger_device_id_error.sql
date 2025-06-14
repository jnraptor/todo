-- ============================================
-- FIX AUDIT TRIGGER DEVICE_ID ERROR
-- ============================================
-- This migration fixes the audit_trigger_function to handle tables
-- that don't have a device_id column (like user_profiles)

-- Recreate the audit_trigger_function to be more flexible
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_device_id text;
    changed_fields jsonb;
    has_device_id boolean;
BEGIN
    -- Get current user ID from auth context
    current_user_id := auth.uid();
    
    -- Check if the table has a device_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'device_id'
        AND table_schema = 'public'
    ) INTO has_device_id;
    
    -- Try to get device_id from the record being modified (only if column exists)
    IF has_device_id THEN
        IF TG_OP = 'DELETE' THEN
            EXECUTE format('SELECT ($1).%I', 'device_id') USING OLD INTO current_device_id;
        ELSE
            EXECUTE format('SELECT ($1).%I', 'device_id') USING NEW INTO current_device_id;
        END IF;
    ELSE
        current_device_id := NULL;
    END IF;
    
    -- Calculate changed fields for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        changed_fields := jsonb_build_object();
        
        -- For todos table, check specific fields
        IF TG_TABLE_NAME = 'todos' THEN
            IF OLD.text IS DISTINCT FROM NEW.text THEN
                changed_fields := changed_fields || jsonb_build_object('text', jsonb_build_object('old', OLD.text, 'new', NEW.text));
            END IF;
            
            IF OLD.completed IS DISTINCT FROM NEW.completed THEN
                changed_fields := changed_fields || jsonb_build_object('completed', jsonb_build_object('old', OLD.completed, 'new', NEW.completed));
            END IF;
            
            IF has_device_id AND OLD.device_id IS DISTINCT FROM NEW.device_id THEN
                changed_fields := changed_fields || jsonb_build_object('device_id', jsonb_build_object('old', OLD.device_id, 'new', NEW.device_id));
            END IF;
            
            IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
                changed_fields := changed_fields || jsonb_build_object('user_id', jsonb_build_object('old', OLD.user_id, 'new', NEW.user_id));
            END IF;
            
            IF OLD.migrated_to_user_id IS DISTINCT FROM NEW.migrated_to_user_id THEN
                changed_fields := changed_fields || jsonb_build_object('migrated_to_user_id', jsonb_build_object('old', OLD.migrated_to_user_id, 'new', NEW.migrated_to_user_id));
            END IF;
        
        -- For user_profiles table, check different fields
        ELSIF TG_TABLE_NAME = 'user_profiles' THEN
            IF OLD.email IS DISTINCT FROM NEW.email THEN
                changed_fields := changed_fields || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
            END IF;
            
            IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
                changed_fields := changed_fields || jsonb_build_object('full_name', jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name));
            END IF;
            
            IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
                changed_fields := changed_fields || jsonb_build_object('avatar_url', jsonb_build_object('old', OLD.avatar_url, 'new', NEW.avatar_url));
            END IF;
            
            IF OLD.provider IS DISTINCT FROM NEW.provider THEN
                changed_fields := changed_fields || jsonb_build_object('provider', jsonb_build_object('old', OLD.provider, 'new', NEW.provider));
            END IF;
        END IF;
    END IF;
    
    -- Insert audit log (this will now run with elevated privileges)
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
        changed_fields,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the operation
        RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
        RETURN CASE 
            WHEN TG_OP = 'DELETE' THEN OLD
            ELSE NEW
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Add comment to document the function
COMMENT ON FUNCTION public.audit_trigger_function() IS 'Audit logging trigger - handles tables with and without device_id column';;
