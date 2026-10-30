import type { HabitFrequency, HabitLogRecord, HabitRecord } from '@/domain/day/types'
import { apiRequest } from './client'

/** 后端 habit 行 */
type HabitRow = {
  id: string
  title: string
  frequency: unknown
  target_value: number | null
  task_time: string | null
  duration: number | null
  is_archived: boolean | null
}

type HabitLogRow = {
  id: string
  habit_id: string | null
  completed_at: string | null
}

function mapFrequency(value: unknown): HabitFrequency {
  if (value && typeof value === 'object' && 'type' in value) {
    return value as HabitFrequency
  }

  return { type: 'daily' }
}

function mapHabit(row: HabitRow): HabitRecord {
  return {
    id: row.id,
    title: row.title,
    // 库里没有 description 列，用目标值兜底展示（详情页与卡片共用）
    targetValue: row.target_value === null || row.target_value === undefined ? '' : String(row.target_value),
    taskTime: row.task_time,
    duration: row.duration,
    frequency: mapFrequency(row.frequency),
    isArchived: Boolean(row.is_archived)
  }
}

function mapLog(row: HabitLogRow): HabitLogRecord {
  return {
    id: row.id,
    habitId: row.habit_id ?? '',
    completedAt: row.completed_at ?? new Date().toISOString()
  }
}

/** 未归档习惯，created_at 升序，与 web 端 habit.list 顺序一致 */
export async function listHabits(): Promise<HabitRecord[]> {
  const rows = await apiRequest<HabitRow[]>('/habits')
  return rows.map(mapHabit)
}

export async function listHabitsIncludingArchived(): Promise<HabitRecord[]> {
  const rows = await apiRequest<HabitRow[]>('/habits', { query: { include_archived: true } })
  return rows.map(mapHabit)
}

function rangeQuery(start: Date, end: Date) {
  return { start: start.toISOString(), end: end.toISOString() }
}

/** 当天打卡记录 */
export async function listHabitLogsForDate(date: Date): Promise<HabitLogRecord[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const rows = await apiRequest<HabitLogRow[]>('/habits/logs', { query: rangeQuery(start, end) })
  return rows.map(mapLog)
}

/** 区间打卡记录，用于热力图 */
export async function listHabitLogsBetween(start: Date, end: Date): Promise<HabitLogRecord[]> {
  const rows = await apiRequest<HabitLogRow[]>('/habits/logs', { query: rangeQuery(start, end) })
  return rows.map(mapLog)
}

/** 单个习惯的全部打卡记录，用于连续天数 / 累计统计 */
export async function listHabitLogsForHabit(habitId: string): Promise<HabitLogRecord[]> {
  const rows = await apiRequest<HabitLogRow[]>(`/habits/${habitId}/logs`)
  return rows.map(mapLog)
}

/** 打卡。同一天重复调用由后端保证幂等，返回既有记录 */
export async function createHabitLog(habitId: string, date: Date): Promise<HabitLogRecord> {
  const row = await apiRequest<HabitLogRow>(`/habits/${habitId}/logs`, {
    method: 'POST',
    body: { completed_at: date.toISOString(), log: '' }
  })

  return mapLog(row)
}

export async function deleteHabitLog(logId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/habits/logs/${logId}`, { method: 'DELETE' })
}

export type HabitInput = {
  title: string
  frequency?: HabitFrequency
  task_time?: string | null
  duration?: number
  target_value?: number
}

export async function createHabit(input: HabitInput): Promise<HabitRecord> {
  const row = await apiRequest<HabitRow>('/habits', {
    method: 'POST',
    body: {
      title: input.title.trim(),
      frequency: input.frequency ?? { type: 'daily' },
      task_time: input.task_time ?? null,
      duration: input.duration ?? 10,
      target_value: input.target_value ?? 1
    }
  })

  return mapHabit(row)
}

export async function updateHabit(habitId: string, input: Partial<HabitInput>): Promise<HabitRecord> {
  const payload: Record<string, unknown> = {}

  if (input.title !== undefined) payload.title = input.title.trim()
  if (input.frequency !== undefined) payload.frequency = input.frequency
  if (input.task_time !== undefined) payload.task_time = input.task_time
  if (input.duration !== undefined) payload.duration = input.duration
  if (input.target_value !== undefined) payload.target_value = input.target_value

  const row = await apiRequest<HabitRow>(`/habits/${habitId}`, { method: 'PATCH', body: payload })
  return mapHabit(row)
}

export async function archiveHabit(habitId: string): Promise<HabitRecord> {
  const row = await apiRequest<HabitRow>(`/habits/${habitId}`, {
    method: 'PATCH',
    body: { is_archived: true }
  })

  return mapHabit(row)
}

export async function deleteHabit(habitId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/habits/${habitId}`, { method: 'DELETE' })
}
