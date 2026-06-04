/**
 * 初始滚动定位
 *
 * 根据日程列表和当前时间，计算页面加载后的滚动目标位置：
 * - 空日程 → 默认 8:00
 * - 非今日 → 定位首个未完成任务
 * - 今日且任务已过期超 2 小时 → 定位当前时间
 * - 其他 → 定位首个未完成任务
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

// 无日程时默认滚动到 8 点位置
const DEFAULT_HOUR = 8

// 任务结束超过此时长（小时）视为过期，定位到当前时间
const STALE_TASK_THRESHOLD_HOURS = 2

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

  // 查找第一个未完成的任务，全部完成则回退到首条
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

  // 任务结束时间距当前时间超过阈值，说明用户可能已跳过该任务，定位到当前时间
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
