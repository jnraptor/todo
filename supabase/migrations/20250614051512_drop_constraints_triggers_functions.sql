-- Drop the constraint that depends on is_valid_device_id
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS valid_device_id;

-- Drop triggers that depend on functions
DROP TRIGGER IF EXISTS audit_todos_changes ON public.todos;
DROP TRIGGER IF EXISTS audit_user_profiles_changes ON public.user_profiles;
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- Now drop all the functions
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.cleanup_rate_limits();
DROP FUNCTION IF EXISTS public.audit_trigger_function();
DROP FUNCTION IF EXISTS public.user_owns_todo(uuid);
DROP FUNCTION IF EXISTS public.get_user_todo_count(uuid);
DROP FUNCTION IF EXISTS public.scheduled_cleanup();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.migrate_device_todos(text, uuid);
DROP FUNCTION IF EXISTS public.is_valid_device_id(text);

-- Drop the problematic view
DROP VIEW IF EXISTS public.my_security_events;;
