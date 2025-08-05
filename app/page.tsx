"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase" // Import Supabase client

// Define the structure for a task item
interface TaskItem {
  id: string
  text: string
  type: "heading" | "task"
  completed?: boolean // Optional for headings
  order_index: number // To maintain order
}

// Initial tasks with temporary IDs and order_index for seeding
const initialTasksData: Omit<TaskItem, "id">[] = [
  { text: "第一阶段：准备与规划", type: "heading", completed: undefined, order_index: 0 },
  {
    text: "用10分钟，列出对报告的所有疑问（不求完美，目标是头脑风暴）",
    type: "task",
    completed: false,
    order_index: 1,
  },
  { text: "创建一个简单的报告大纲，确定需要分析的关键维度", type: "task", completed: false, order_index: 2 },
  {
    text: "安排15分钟与主管沟通，确认报告范围和期望（记住：提问是专业的表现，不是能力不足）",
    type: "task",
    completed: false,
    order_index: 3,
  },
  { text: "第二阶段：数据收集", type: "heading", completed: undefined, order_index: 4 },
  {
    text: "为每个产品分配30分钟，收集基本信息（使用番茄工作法，每30分钟休息5分钟）",
    type: "task",
    completed: false,
    order_index: 5,
  },
  {
    text: "咨询产品部门获取数据或测试（记住：团队合作是工作的一部分）",
    type: "task",
    completed: false,
    order_index: 6,
  },
  { text: "第三阶段：分析与撰写", type: "heading", completed: undefined, order_index: 7 },
  { text: "创建比较表格，突出各产品的优缺点", type: "task", completed: false, order_index: 8 },
  { text: "撰写初稿（不求完美，目标是有一个可迭代的版本）", type: "task", completed: false, order_index: 9 },
  { text: "请一位信任的同事审阅并提供优化建议", type: "task", completed: false, order_index: 10 },
  { text: "根据反馈修改并完善报告", type: "task", completed: false, order_index: 11 },
]

export default function TaskListPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "success" | "failed">("connecting")

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setConnectionStatus("connecting")

    try {
      const { data, error } = await supabase.from("tasks").select("*").order("order_index", { ascending: true })

      if (error) {
        console.error("Error fetching tasks:", error)
        setError(error.message)
        setConnectionStatus("failed")
        return
      }

      if (data.length === 0) {
        // If no tasks exist, seed the database with initial data
        const { error: insertError } = await supabase.from("tasks").insert(initialTasksData)
        if (insertError) {
          console.error("Error seeding initial tasks:", insertError)
          setError(insertError.message)
          setConnectionStatus("failed")
          return
        }
        // Fetch again after seeding
        const { data: newData, error: newError } = await supabase
          .from("tasks")
          .select("*")
          .order("order_index", { ascending: true })
        if (newError) {
          console.error("Error refetching after seeding:", newError)
          setError(newError.message)
          setConnectionStatus("failed")
          return
        }
        setTasks(newData as TaskItem[])
      } else {
        setTasks(data as TaskItem[])
      }
      setConnectionStatus("success")
    } catch (e: any) {
      console.error("Unexpected error:", e)
      setError(e.message || "An unexpected error occurred.")
      setConnectionStatus("failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTaskCompletion = async (id: string) => {
    // Optimistic update
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))

    const currentTask = tasks.find((task) => task.id === id)
    if (!currentTask) return

    try {
      const { error } = await supabase.from("tasks").update({ completed: !currentTask.completed }).eq("id", id)

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
          <CardTitle className="text-3xl font-bold text-center mb-4">任务列表</CardTitle>
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
