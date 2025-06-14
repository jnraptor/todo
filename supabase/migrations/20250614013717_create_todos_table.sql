-- Create todos table with dual ownership support
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ownership fields
  device_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  
  -- Ensure exactly one owner type
  CONSTRAINT single_owner CHECK (
    (user_id IS NOT NULL AND device_id IS NULL) OR
    (user_id IS NULL AND device_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_todos_device_id ON todos(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_todos_user_id ON todos(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);;
