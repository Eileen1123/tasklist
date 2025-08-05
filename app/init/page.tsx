"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { initializeDatabase } from "@/lib/init-db"

export default function InitPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleInitialize = async () => {
    setIsInitializing(true)
    setResult("正在初始化数据库...")

    try {
      const response = await initializeDatabase()
      if (response.success) {
        setResult("✅ 数据库初始化成功！现在可以注册和登录了。")
      } else {
        setResult(`❌ 初始化失败: ${response.error}`)
      }
    } catch (error) {
      setResult(`❌ 初始化失败: ${error}`)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">数据库初始化</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            点击下面的按钮来初始化数据库表结构。这将创建用户表、任务表和关联表。
          </p>
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? "初始化中..." : "初始化数据库"}
          </Button>
          {result && (
            <div className="mt-4 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
