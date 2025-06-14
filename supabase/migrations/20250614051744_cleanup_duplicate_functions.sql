-- Drop all versions of get_user_todo_count function
DROP FUNCTION IF EXISTS public.get_user_todo_count(uuid);
DROP FUNCTION IF EXISTS public.get_user_todo_count();

-- Recreate the function with proper search_path setting
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

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_user_todo_count(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_todo_count(uuid) IS 'Get user todo count - search_path secured';;
