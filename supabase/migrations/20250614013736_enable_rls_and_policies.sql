-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Anonymous access policy (using custom header)
CREATE POLICY "Anonymous device access" ON todos
  FOR ALL 
  USING (
    device_id IS NOT NULL AND
    device_id = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

-- Authenticated user access policy
CREATE POLICY "Authenticated user access" ON todos
  FOR ALL 
  USING (
    user_id IS NOT NULL AND
    auth.uid() = user_id
  );;
