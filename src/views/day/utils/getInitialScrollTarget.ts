/**
 * ============================================
 * 初始滚动定位 (views/day/utils/getInitialScrollTarget.ts)
 * ============================================
 *
 * 【模块职责】
 * - 根据日程列表和当前时间，计算页面加载后的滚动目标位置
 * - 返回值为联合类型，供调用方按 type 分支处理
 */

import { isSameDay } from '@/utils/dateFormatter'
import type { ScrollTarget, TimelineTaskBase } from './types'

// 日程任务：至少包含 completed 和 startHour 字段
type ScheduleTask = TimelineTaskBase & { completed?: boolean }

// 入参：日程列表、目标日期、当前时间
interface ScrollTargetOptions {
  schedule?: ScheduleTask[]
  targetDate?: Date
  now?: Date
}

const DEFAULT_HOUR = 8
const STALE_TASK_THRESHOLD_HOURS = 2

// 空日程 → 默认 8:00；非今日 → 定位首个未完成任务；今日且任务过期 → 定位当前时间；否则定位任务
export const getInitialScrollTarget = ({
  schedule = [],
  targetDate,
  now = new Date()
}: ScrollTargetOptions = {}): ScrollTarget => {
  if (!schedule.length) {
    return {
      type: 'default-hour',
      hour: DEFAULT_HOUR
    }
  }

  // 查找第一个未完成的任务索引，全部完成则回退到首条
  const firstUncompletedIndex = schedule.findIndex(task => !task.completed)
  const targetIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0
  const targetTask = schedule[targetIndex]

  // 非目标日期的页面，直接定位到首个未完成任务
  if (!targetDate || !isSameDay(targetDate, now)) {
    return {
      type: 'task',
      index: targetIndex
    }
  }

  // 目标日期为今日：检查任务是否已过期超过阈值
  const currentHour = now.getHours() + now.getMinutes() / 60
  const taskEndHour = (targetTask!.startHour ?? 0) + (targetTask!.durationHours || 0)

  if (currentHour - taskEndHour >= STALE_TASK_THRESHOLD_HOURS) {
    return {
      type: 'current-time',
      hour: Math.floor(currentHour)
    }
  }

  return {
    type: 'task',
    index: targetIndex
  }
}
