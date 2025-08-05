"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase" // 导入 Supabase 客户端

// 定义任务项的结构
interface TaskItem {
  id: string
  text: string
  type: "heading" | "task"
  completed?: boolean // Optional for headings, will be false in DB for headings
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 从 Supabase 获取任务
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("id", { ascending: true }) // 假设 id 可以用于排序，或者添加一个 order_index 字段

      if (error) {
        throw error
      }
      setTasks(data || [])
    } catch (error: any) {
      console.error("Error fetching tasks:", error.message)
      setFetchError("无法连接到云端数据或获取任务列表。请检查您的 Supabase 配置。")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 切换任务完成状态并更新 Supabase
  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      // 乐观更新 UI
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
      )

      const taskToUpdate = tasks.find((task) => task.id === id)
      if (!taskToUpdate) return

      try {
        const { error } = await supabase.from("tasks").update({ completed: !taskToUpdate.completed }).eq("id", id)

        if (error) {
          throw error
        }
      } catch (error: any) {
        console.error("Error updating task completion:", error.message)
        setFetchError("更新任务状态失败。请重试。")
        // 如果更新失败，回滚 UI 状态
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
        )
      }
    },
    [tasks],
  )

  const { completedPercentage, allTasksCompleted } = useMemo(() => {
    const actualTasks = tasks.filter((task) => task.type === "task")
    const totalTasks = actualTasks.length
    const completedTasks = actualTasks.filter((task) => task.completed).length

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const allDone = totalTasks > 0 && completedTasks === totalTasks

    return { completedPercentage: percentage, allTasksCompleted: allDone }
  }, [tasks])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">任务列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div className="text-center text-gray-600 dark:text-gray-400">正在加载任务...</div>}
          {fetchError && (
            <div className="text-center text-red-600 dark:text-red-400">
              {fetchError}
              <br />
              请确保您的 Supabase URL 和 Anon Key 已正确配置，并且 RLS 已禁用。
            </div>
          )}
          {!loading && !fetchError && tasks.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400">没有任务。请在 Supabase 中添加一些任务。</div>
          )}
          {!loading && !fetchError && tasks.length > 0 && (
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
