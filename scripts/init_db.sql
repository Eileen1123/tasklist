-- scripts/init_db.sql

-- Drop the table if it already exists to ensure a clean slate for this demo
DROP TABLE IF EXISTS tasks;

-- Create the tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL, -- 'heading' or 'task'
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL -- To maintain the order of tasks
);

-- Disable Row Level Security (RLS) for demonstration purposes as requested.
-- WARNING: In a production environment, RLS should be enabled and properly configured.
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- You can also grant full access to the public role for this demo,
-- but disabling RLS is a stronger statement for a demo.
-- GRANT ALL ON TABLE tasks TO public;
