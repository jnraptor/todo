-- Drop and recreate the view to ensure it's properly configured without SECURITY DEFINER
DROP VIEW IF EXISTS public.my_security_events;

-- Recreate the view explicitly without SECURITY DEFINER (SECURITY INVOKER is default)
CREATE VIEW public.my_security_events 
WITH (security_invoker=true) AS
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

-- Grant permission
GRANT SELECT ON public.my_security_events TO authenticated;

-- Add comment
COMMENT ON VIEW public.my_security_events IS 'Security events view - explicitly uses SECURITY INVOKER for proper RLS enforcement';;
