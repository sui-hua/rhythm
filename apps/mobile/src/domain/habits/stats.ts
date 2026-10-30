import type { HabitFrequency, HabitLogRecord, HabitRecord } from '@/domain/day/types'
import { addDays, getWeekStart, isSameDay, toDateKey } from '@/domain/day/time'

/**
 * 习惯统计的纯逻辑。
 *
 * 原先这些函数住在 `src/mocks/data.ts` 里，但它们不依赖任何假数据。
 * 页面接真实 API 后必须迁出来，否则生产代码要长期从 mocks 目录 import。
 *
 * 数据结构用「习惯 → 已打卡日期集合」，一次归约后所有统计都是 O(1) 查表。
 */

export type HabitLogIndex = Map<string, Set<string>>

/** 把打卡记录归约成 habitId → Set<'YYYY-MM-DD'> */
export function buildHabitLogIndex(logs: HabitLogRecord[]): HabitLogIndex {
  const index: HabitLogIndex = new Map()

  for (const log of logs) {
    if (!log.habitId || !log.completedAt) continue

    const dateKey = toDateKey(new Date(log.completedAt))
    const bucket = index.get(log.habitId)

    if (bucket) {
      bucket.add(dateKey)
    } else {
      index.set(log.habitId, new Set([dateKey]))
    }
  }

  return index
}

export function hasLogOn(index: HabitLogIndex, habitId: string, date: Date): boolean {
  return index.get(habitId)?.has(toDateKey(date)) ?? false
}

/** 连续打卡天数：今天已打卡从今天算，否则从昨天往前算 */
export function habitStreak(index: HabitLogIndex, habitId: string, today: Date): number {
  const dates = index.get(habitId)
  if (!dates || dates.size === 0) return 0

  let streak = 0
  let cursor = dates.has(toDateKey(today)) ? today : addDays(today, -1)

  while (dates.has(toDateKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }

  return streak
}

/** 本周（周一起）打卡次数 */
export function habitWeekCount(index: HabitLogIndex, habitId: string, today: Date): number {
  const dates = index.get(habitId)
  if (!dates) return 0

  const weekStart = getWeekStart(today)
  let count = 0

  for (let i = 0; i < 7; i++) {
    if (dates.has(toDateKey(addDays(weekStart, i)))) count++
  }

  return count
}

export function habitTotalCount(index: HabitLogIndex, habitId: string): number {
  return index.get(habitId)?.size ?? 0
}

/** 频率的中文描述，替代库里缺失的 description 字段 */
export function formatHabitFrequency(frequency: HabitFrequency): string {
  if (frequency.type === 'weekly' && frequency.weekdays.length > 0) {
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `每周${frequency.weekdays.map((day) => names[day]?.replace('周', '') ?? '').join('、')}`
  }

  if (frequency.type === 'monthly' && frequency.monthDays.length > 0) {
    return `每月 ${frequency.monthDays.join('、')} 日`
  }

  return '每天'
}

/** 卡片上的状态文案：今天已完成 / 本周完成 N 次 / 已坚持 N 天 */
export function habitStatusText(habit: HabitRecord, index: HabitLogIndex, today: Date): string {
  if (hasLogOn(index, habit.id, today)) return '今天已完成'

  if (habit.frequency.type === 'weekly') {
    return `本周完成 ${habitWeekCount(index, habit.id, today)} 次`
  }

  return `已坚持 ${habitStreak(index, habit.id, today)} 天`
}

export type HeatmapCell = {
  dateKey: string
  logged: boolean
  future: boolean
}

/** 热力图矩阵：weeks 列 × 7 行，最后一列是本周 */
export function habitHeatmap(
  index: HabitLogIndex,
  habitId: string,
  today: Date,
  weeks: number
): HeatmapCell[][] {
  const dates = index.get(habitId)
  const weekStart = getWeekStart(today)
  const start = addDays(weekStart, -7 * (weeks - 1))
  const columns: HeatmapCell[][] = []

  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = []

    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const dateKey = toDateKey(date)
      column.push({
        dateKey,
        logged: dates?.has(dateKey) ?? false,
        future: date.getTime() > today.getTime() && !isSameDay(date, today)
      })
    }

    columns.push(column)
  }

  return columns
}
