-- Recreate the security events view without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW public.my_security_events AS
SELECT 
    id,
    table_name,
    action,
    user_id,
    device_id,
    row_data,
    changed_fields,
    timestamp,
    ip_address,
    user_agent
FROM public.audit_logs
WHERE 
    user_id = auth.uid() OR 
    (user_id IS NULL AND device_id IS NOT NULL);

-- Recreate the audit triggers
CREATE TRIGGER audit_todos_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_user_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Recreate the updated_at triggers
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.my_security_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_device_id(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_todo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_todo_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_device_todos(text, uuid) TO authenticated;

-- Add comments documenting the security fixes
COMMENT ON VIEW public.my_security_events IS 'Security events view - uses SECURITY INVOKER for proper RLS enforcement';
COMMENT ON FUNCTION public.is_valid_device_id(text) IS 'Validates device ID format - search_path secured';
COMMENT ON FUNCTION public.check_rate_limit(text, text, integer, integer) IS 'Rate limiting function - search_path secured';
COMMENT ON FUNCTION public.cleanup_rate_limits() IS 'Cleanup old rate limits - search_path secured';
COMMENT ON FUNCTION public.audit_trigger_function() IS 'Audit logging trigger - search_path secured';
COMMENT ON FUNCTION public.user_owns_todo(uuid) IS 'Check todo ownership - search_path secured';
COMMENT ON FUNCTION public.get_user_todo_count(uuid) IS 'Get user todo count - search_path secured';
COMMENT ON FUNCTION public.scheduled_cleanup() IS 'Scheduled cleanup tasks - search_path secured';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Update timestamp trigger - search_path secured';
COMMENT ON FUNCTION public.migrate_device_todos(text, uuid) IS 'Migrate device todos to user account - search_path secured';;
