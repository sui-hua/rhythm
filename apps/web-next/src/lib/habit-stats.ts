import type { HabitFrequency, HabitLogRecord, HabitRecord } from './api'
import { addDays, getWeekStart, toDateKey } from './date'

/** habitId → 已打卡日期集合 */
export type HabitLogIndex = Map<string, Set<string>>

export function buildHabitLogIndex(logs: HabitLogRecord[]): HabitLogIndex {
  const index: HabitLogIndex = new Map()

  for (const log of logs) {
    if (!log.habitId || !log.completedAt) continue
    const dateKey = toDateKey(new Date(log.completedAt))
    const bucket = index.get(log.habitId)
    if (bucket) bucket.add(dateKey)
    else index.set(log.habitId, new Set([dateKey]))
  }

  return index
}

export function hasLogOn(index: HabitLogIndex, habitId: string, date: Date): boolean {
  return index.get(habitId)?.has(toDateKey(date)) ?? false
}

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

export function formatHabitFrequency(frequency: HabitFrequency): string {
  if (frequency.type === 'weekly' && frequency.weekdays.length > 0) {
    const names = ['日', '一', '二', '三', '四', '五', '六']
    return `每周${frequency.weekdays.map((day) => names[day] ?? '').join('、')}`
  }

  if (frequency.type === 'monthly' && frequency.monthDays.length > 0) {
    return `每月 ${frequency.monthDays.join('、')} 日`
  }

  return '每天'
}

export function habitStatusText(habit: HabitRecord, index: HabitLogIndex, today: Date): string {
  if (hasLogOn(index, habit.id, today)) return '今天已完成'
  if (habit.frequency.type === 'weekly') {
    return `本周完成 ${habitWeekCount(index, habit.id, today)} 次`
  }
  return `已坚持 ${habitStreak(index, habit.id, today)} 天`
}

export type HeatmapCell = { dateKey: string; logged: boolean; future: boolean }

/** weeks 列 × 7 行的热力图矩阵，最后一列是本周 */
export function habitHeatmap(
  index: HabitLogIndex,
  habitId: string,
  today: Date,
  weeks: number
): HeatmapCell[][] {
  const dates = index.get(habitId)
  const start = addDays(getWeekStart(today), -7 * (weeks - 1))
  const todayKey = toDateKey(today)
  const columns: HeatmapCell[][] = []

  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = []

    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const dateKey = toDateKey(date)
      column.push({
        dateKey,
        logged: dates?.has(dateKey) ?? false,
        future: dateKey > todayKey
      })
    }

    columns.push(column)
  }

  return columns
}
