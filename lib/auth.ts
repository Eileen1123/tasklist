import { supabase } from "./supabase"
import crypto from "crypto"

// MD5 hash function for password
export function md5Hash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex')
}

// User interface
export interface User {
  id: string
  username: string
  created_at: string
  updated_at: string
}

// Register a new user
export async function registerUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return { success: false, error: '用户名已存在' }
    }

    // Hash password
    const passwordHash = md5Hash(password)

    // Insert new user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash
      })
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      return { success: false, error: '注册失败，请重试' }
    }

    // Initialize user tasks
    await initializeUserTasks(user.id)

    return { success: true, user }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: '注册失败，请重试' }
  }
}

// Login user
export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const passwordHash = md5Hash(password)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single()

    if (error || !user) {
      return { success: false, error: '用户名或密码错误' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: '登录失败，请重试' }
  }
}

// Initialize user tasks (create user-specific task instances)
async function initializeUserTasks(userId: string): Promise<void> {
  try {
    // Get all task templates
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .order('order_index', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return
    }

    // Create user-specific task instances
    const userTasks = tasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      completed: false
    }))

    const { error: insertError } = await supabase
      .from('user_tasks')
      .insert(userTasks)

    if (insertError) {
      console.error('Error initializing user tasks:', insertError)
    }
  } catch (error) {
    console.error('Error initializing user tasks:', error)
  }
}
