-- Fix the is_valid_device_id function with correct regex
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
    
    -- Check if it's a valid UUID format or alphanumeric string with hyphens and underscores
    RETURN device_id ~ '^[a-zA-Z0-9_-]+$';
END;
$$;

-- Now recreate the constraint
ALTER TABLE public.todos 
ADD CONSTRAINT valid_device_id 
CHECK (device_id IS NULL OR public.is_valid_device_id(device_id));;
