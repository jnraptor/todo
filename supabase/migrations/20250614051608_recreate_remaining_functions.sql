-- Create remaining functions with search_path security fixes

-- 6. Create user_owns_todo function with search_path fix
CREATE OR REPLACE FUNCTION public.user_owns_todo(todo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    todo_user_id uuid;
    todo_device_id text;
BEGIN
    current_user_id := auth.uid();
    
    -- Get todo ownership info
    SELECT user_id, device_id
    INTO todo_user_id, todo_device_id
    FROM public.todos
    WHERE id = todo_id;
    
    -- Check if user owns the todo directly
    IF todo_user_id = current_user_id THEN
        RETURN true;
    END IF;
    
    -- For device todos, we need additional logic here
    -- This would depend on your device authentication mechanism
    RETURN false;
END;
$$;

-- 7. Create get_user_todo_count function with search_path fix
CREATE OR REPLACE FUNCTION public.get_user_todo_count(p_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    todo_count integer;
BEGIN
    -- Use provided user_id or current authenticated user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Only allow users to get their own count
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: can only get your own todo count';
    END IF;
    
    SELECT COUNT(*)
    INTO todo_count
    FROM public.todos
    WHERE user_id = target_user_id;
    
    RETURN todo_count;
END;
$$;

-- 8. Create scheduled_cleanup function with search_path fix
CREATE OR REPLACE FUNCTION public.scheduled_cleanup()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Clean up old rate limits
    PERFORM public.cleanup_rate_limits();
    
    -- Clean up old audit logs (keep last 90 days)
    DELETE FROM public.audit_logs
    WHERE timestamp < (now() - interval '90 days');
    
    -- Clean up orphaned device todos older than 1 year
    DELETE FROM public.todos
    WHERE user_id IS NULL 
      AND device_id IS NOT NULL 
      AND created_at < (now() - interval '1 year');
END;
$$;

-- 9. Create migrate_device_todos function with search_path fix
CREATE OR REPLACE FUNCTION public.migrate_device_todos(
    p_device_id text,
    p_user_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    migrated_count integer := 0;
BEGIN
    -- Use provided user_id or current authenticated user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Validate inputs
    IF p_device_id IS NULL OR target_user_id IS NULL THEN
        RAISE EXCEPTION 'Device ID and User ID are required';
    END IF;
    
    -- Only allow authenticated users to migrate to their own account
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: can only migrate to your own account';
    END IF;
    
    -- Check if migration already exists
    IF EXISTS (
        SELECT 1 FROM public.device_migrations 
        WHERE device_id = p_device_id AND user_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'Device has already been migrated to this user account';
    END IF;
    
    -- Update todos: set user_id and migration info
    UPDATE public.todos
    SET 
        user_id = target_user_id,
        migrated_to_user_id = target_user_id,
        migration_timestamp = now(),
        original_device_id = device_id,
        updated_at = now()
    WHERE device_id = p_device_id 
      AND user_id IS NULL;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    
    -- Record the migration
    INSERT INTO public.device_migrations (
        device_id,
        user_id,
        migrated_at,
        todos_count
    ) VALUES (
        p_device_id,
        target_user_id,
        now(),
        migrated_count
    );
    
    RETURN migrated_count;
END;
$$;;
