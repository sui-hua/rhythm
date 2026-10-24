/**
 * @fileoverview Summary 预填数据工具
 * 提供今日数据概览获取和每日总结表单预填功能。
 */

import type { Ref } from 'vue'
import { db } from '@/services/database'

// 今日数据概览接口
export interface TodayDataOverview {
  completedTaskCount: number
  totalTaskCount: number
  completionRate: number
  habitLogCount: number
  completedTaskTitles: string[]
}

// 任务项接口（用于预填）
interface PrefillTaskItem {
  title: string
  completed: boolean
}

// 习惯项接口（用于预填）
interface PrefillHabitItem {
  title: string
  completed: boolean
}

// 方向计划项接口（用于预填）
interface PrefillDirectionItem {
  title: string
  sourceMeta?: {
    planTitle?: string
  }
}

// 预填参数接口
interface BuildDailySummaryPrefillParams {
  tasks?: PrefillTaskItem[]
  habits?: PrefillHabitItem[]
  directionItems?: PrefillDirectionItem[]
}

// 预填结果接口
export interface DailySummaryPrefillData extends Record<string, string> {
  done: string
  improve: string
  tomorrow: string
}

/**
 * 获取今日数据概览，用于总结模块展示任务完成率和习惯打卡统计
 * @returns 今日数据概览对象
 */
export async function fetchTodayDataOverview(): Promise<TodayDataOverview> {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  const [tasks, habitLogs] = await Promise.all([
    db.task.list(startOfDay, endOfDay),
    db.habit.listLogsByDate(startOfDay, endOfDay)
  ])

  const completedTasks = (tasks || []).filter(t => t.completed)
  const totalTasks = (tasks || []).length

  return {
    completedTaskCount: completedTasks.length,
    totalTaskCount: totalTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
    habitLogCount: (habitLogs || []).length,
    completedTaskTitles: completedTasks.map(t => t.title)
  }
}

/**
 * 根据任务、习惯和方向计划数据构建每日总结预填内容
 * @param params - 包含 tasks、habits、directionItems 的数据对象
 * @returns 预填的总结表单数据
 */
export function buildDailySummaryPrefill({ tasks = [], habits = [], directionItems = [] }: BuildDailySummaryPrefillParams): DailySummaryPrefillData {
  const doneLines = [
    ...tasks.filter((item) => item.completed).map((item) => item.title),
    ...habits.filter((item) => item.completed).map((item) => item.title)
  ]

  const tomorrowLines = directionItems.map((item) => {
    const title = item.sourceMeta?.planTitle ? `${item.sourceMeta.planTitle}：${item.title}` : item.title
    return `继续推进 ${title}`
  })

  return {
    done: doneLines.join('\n'),
    improve: '',
    tomorrow: tomorrowLines.join('\n')
  }
}
