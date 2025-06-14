-- Fix the audit trigger function to avoid JSONB - JSONB operator issue
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_device_id text;
    changed_fields jsonb;
BEGIN
    -- Get current user ID from auth context
    current_user_id := auth.uid();
    
    -- Try to get device_id from the record being modified
    IF TG_OP = 'DELETE' THEN
        current_device_id := OLD.device_id;
    ELSE
        current_device_id := NEW.device_id;
    END IF;
    
    -- Calculate changed fields for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        changed_fields := jsonb_build_object();
        
        -- Check each field individually
        IF OLD.text IS DISTINCT FROM NEW.text THEN
            changed_fields := changed_fields || jsonb_build_object('text', jsonb_build_object('old', OLD.text, 'new', NEW.text));
        END IF;
        
        IF OLD.completed IS DISTINCT FROM NEW.completed THEN
            changed_fields := changed_fields || jsonb_build_object('completed', jsonb_build_object('old', OLD.completed, 'new', NEW.completed));
        END IF;
        
        IF OLD.device_id IS DISTINCT FROM NEW.device_id THEN
            changed_fields := changed_fields || jsonb_build_object('device_id', jsonb_build_object('old', OLD.device_id, 'new', NEW.device_id));
        END IF;
        
        IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
            changed_fields := changed_fields || jsonb_build_object('user_id', jsonb_build_object('old', OLD.user_id, 'new', NEW.user_id));
        END IF;
        
        IF OLD.migrated_to_user_id IS DISTINCT FROM NEW.migrated_to_user_id THEN
            changed_fields := changed_fields || jsonb_build_object('migrated_to_user_id', jsonb_build_object('old', OLD.migrated_to_user_id, 'new', NEW.migrated_to_user_id));
        END IF;
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
        changed_fields,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;;
