import { supabase } from "./supabase"

export async function initializeDatabase() {
  try {
    console.log("开始初始化数据库...")

    // 删除现有表（如果存在）
    await supabase.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS user_tasks CASCADE;' })
    await supabase.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS tasks CASCADE;' })
    await supabase.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS users CASCADE;' })

    // 创建用户表
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    // 创建任务模板表
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          text TEXT NOT NULL,
          type TEXT NOT NULL,
          order_index INTEGER NOT NULL
        );
      `
    })

    // 创建用户任务关联表
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE user_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, task_id)
        );
      `
    })

    // 禁用 RLS
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;' })
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;' })
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;' })

    // 插入初始任务模板
    const initialTasks = [
      { text: "第一阶段：准备与规划", type: "heading", order_index: 0 },
      { text: "用10分钟，列出对报告的所有疑问（不求完美，目标是头脑风暴）", type: "task", order_index: 1 },
      { text: "创建一个简单的报告大纲，确定需要分析的关键维度", type: "task", order_index: 2 },
      { text: "安排15分钟与主管沟通，确认报告范围和期望（记住：提问是专业的表现，不是能力不足）", type: "task", order_index: 3 },
      { text: "第二阶段：数据收集", type: "heading", order_index: 4 },
      { text: "为每个产品分配30分钟，收集基本信息（使用番茄工作法，每30分钟休息5分钟）", type: "task", order_index: 5 },
      { text: "咨询产品部门获取数据或测试（记住：团队合作是工作的一部分）", type: "task", order_index: 6 },
      { text: "第三阶段：分析与撰写", type: "heading", order_index: 7 },
      { text: "创建比较表格，突出各产品的优缺点", type: "task", order_index: 8 },
      { text: "撰写初稿（不求完美，目标是有一个可迭代的版本）", type: "task", order_index: 9 },
      { text: "请一位信任的同事审阅并提供优化建议", type: "task", order_index: 10 },
      { text: "根据反馈修改并完善报告", type: "task", order_index: 11 }
    ]

    for (const task of initialTasks) {
      await supabase.from('tasks').insert(task)
    }

    // 创建索引
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);' })
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX idx_user_tasks_task_id ON user_tasks(task_id);' })
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX idx_tasks_order_index ON tasks(order_index);' })
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX idx_users_username ON users(username);' })

    console.log("数据库初始化完成！")
    return { success: true }
  } catch (error) {
    console.error("数据库初始化失败:", error)
    return { success: false, error }
  }
} 