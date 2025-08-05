"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { User } from "@/lib/auth"

// Define the structure for a task item
interface TaskItem {
  id: string
  text: string
  type: "heading" | "task"
  completed?: boolean
  order_index: number
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "success" | "failed">("connecting")
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Check if user is logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    setConnectionStatus("connecting")

    try {
      // Fetch user-specific tasks with task details
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          id,
          completed,
          tasks (
            id,
            text,
            type,
            order_index
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error("Error fetching tasks:", error)
        setError(error.message)
        setConnectionStatus("failed")
        return
      }

      // Transform the data to match our TaskItem interface and sort by order_index
      const transformedTasks = data
        .map((item: any) => ({
          id: item.id,
          text: item.tasks.text,
          type: item.tasks.type,
          completed: item.completed,
          order_index: item.tasks.order_index
        }))
        .sort((a, b) => a.order_index - b.order_index)

      setTasks(transformedTasks)
      setConnectionStatus("success")
    } catch (e: any) {
      console.error("Unexpected error:", e)
      setError(e.message || "An unexpected error occurred.")
      setConnectionStatus("failed")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      setIsLoading(false)
    }
  }, [user, fetchTasks])

  const toggleTaskCompletion = async (id: string) => {
    if (!user) return

    // Optimistic update
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))

    const currentTask = tasks.find((task) => task.id === id)
    if (!currentTask) return

    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ completed: !currentTask.completed })
        .eq('id', id)

      if (error) {
        console.error("Error updating task in Supabase:", error)
        setError(error.message)
        setConnectionStatus("failed")
        // Revert optimistic update if update fails
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
        )
      }
    } catch (e: any) {
      console.error("Unexpected error during update:", e)
      setError(e.message || "An unexpected error occurred during update.")
      setConnectionStatus("failed")
      // Revert optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
      )
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setTasks([])
    router.push("/login")
  }

  const { completedPercentage, allTasksCompleted } = useMemo(() => {
    const actualTasks = tasks.filter((task) => task.type === "task")
    const totalTasks = actualTasks.length
    const completedTasks = actualTasks.filter((task) => task.completed).length

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const allDone = totalTasks > 0 && completedTasks === totalTasks

    return { completedPercentage: percentage, allTasksCompleted: allDone }
  }, [tasks])

  // Show login/register page if user is not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">任务列表</CardTitle>
            <div className="text-center text-gray-600 dark:text-gray-400">
              请登录或注册以开始管理您的任务
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full">登录</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">注册</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">任务列表</CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                欢迎，{user.username}！
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                退出登录
              </Button>
            </div>
          </div>
          {connectionStatus === "connecting" && (
            <div className="text-center text-blue-600 dark:text-blue-400">正在连接云端数据...</div>
          )}
          {connectionStatus === "success" && (
            <div className="text-center text-green-600 dark:text-green-400">已成功链接云端数据！</div>
          )}
          {connectionStatus === "failed" && (
            <div className="text-center text-red-600 dark:text-red-400">链接失败: {error || "未知错误"}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">加载中...</div>
          ) : (
            <>
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">完成进度:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {allTasksCompleted ? "已完成" : `${completedPercentage}%`}
                  </span>
                </div>
                <Progress value={completedPercentage} className="h-2" />
              </div>

              <div className="space-y-4">
                {tasks.map((item) => (
                  <div key={item.id}>
                    {item.type === "heading" ? (
                      <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">{item.text}</h2>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors",
                          item.completed
                            ? "bg-green-50 dark:bg-green-950 text-gray-500 line-through"
                            : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
                        )}
                        onClick={() => toggleTaskCompletion(item.id)}
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.completed}
                          onCheckedChange={() => toggleTaskCompletion(item.id)}
                          className="data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor={item.id}
                          className={cn(
                            "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            item.completed && "text-gray-500 dark:text-gray-400",
                          )}
                        >
                          {item.text}
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
