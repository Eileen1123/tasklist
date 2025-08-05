-- scripts/init_db.sql

-- Drop the tables if they already exist to ensure a clean slate for this demo
DROP TABLE IF EXISTS user_tasks;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

-- Create the users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the tasks table (public tasks template)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL, -- 'heading' or 'task'
  order_index INTEGER NOT NULL -- To maintain the order of tasks
);

-- Create the user_tasks table (user-specific task instances)
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Disable Row Level Security (RLS) for demonstration purposes as requested.
-- WARNING: In a production environment, RLS should be enabled and properly configured.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;

-- Insert initial task templates
INSERT INTO tasks (text, type, order_index) VALUES
  ('第一阶段：准备与规划', 'heading', 0),
  ('用10分钟，列出对报告的所有疑问（不求完美，目标是头脑风暴）', 'task', 1),
  ('创建一个简单的报告大纲，确定需要分析的关键维度', 'task', 2),
  ('安排15分钟与主管沟通，确认报告范围和期望（记住：提问是专业的表现，不是能力不足）', 'task', 3),
  ('第二阶段：数据收集', 'heading', 4),
  ('为每个产品分配30分钟，收集基本信息（使用番茄工作法，每30分钟休息5分钟）', 'task', 5),
  ('咨询产品部门获取数据或测试（记住：团队合作是工作的一部分）', 'task', 6),
  ('第三阶段：分析与撰写', 'heading', 7),
  ('创建比较表格，突出各产品的优缺点', 'task', 8),
  ('撰写初稿（不求完美，目标是有一个可迭代的版本）', 'task', 9),
  ('请一位信任的同事审阅并提供优化建议', 'task', 10),
  ('根据反馈修改并完善报告', 'task', 11);

-- Create indexes for better performance
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX idx_tasks_order_index ON tasks(order_index);
CREATE INDEX idx_users_username ON users(username);
