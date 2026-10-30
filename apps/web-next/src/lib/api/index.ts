import { apiRequest } from './client'

/** 领域记录：字段名与移动端保持一致，方便后续抽公共包 */
export type TaskRecord = {
  id: string
  title: string
  notes: string
  startAt: string | null
  endAt: string | null
  completed: boolean
}

export type DailyPlanRecord = {
  id: string
  title: string
  description: string
  day: string
  taskTime: string | null
  duration: number | null
  status: string | null
}

export type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; monthDays: number[] }

export type HabitRecord = {
  id: string
  title: string
  targetValue: string
  taskTime: string | null
  duration: number | null
  frequency: HabitFrequency
}

export type HabitLogRecord = {
  id: string
  habitId: string
  completedAt: string
}

export type GoalDayItem = {
  id: string
  title: string
  day: string
  status: string | null
}

export type GoalMonthItem = {
  id: string
  title: string
  month: string | null
  days: GoalDayItem[]
}

export type GoalItem = {
  id: string
  title: string
  description: string
  status: string
  priority: number | null
  categoryId: string | null
  categoryName: string | null
  months: GoalMonthItem[]
}

export type GoalCategory = { id: string; name: string }

export type SummaryKind = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type SummaryRecord = {
  id: string
  kind: SummaryKind
  dateKey: string
  title: string
  content: Record<string, string>
}

/* ------------------------------- 映射 ------------------------------- */

type TaskRow = {
  id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  completed: boolean | null
}

function mapTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    notes: row.description ?? '',
    startAt: row.start_time,
    endAt: row.end_time,
    completed: Boolean(row.completed)
  }
}

type GoalDayRow = {
  id: string
  title: string
  description: string | null
  day: string
  task_time: string | null
  duration: number | null
  status: string | null
}

function mapDailyPlan(row: GoalDayRow): DailyPlanRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    day: row.day,
    taskTime: row.task_time,
    duration: row.duration,
    status: row.status
  }
}

type HabitRow = {
  id: string
  title: string
  frequency: unknown
  target_value: number | null
  task_time: string | null
  duration: number | null
}

function mapHabit(row: HabitRow): HabitRecord {
  const frequency =
    row.frequency && typeof row.frequency === 'object' && 'type' in row.frequency
      ? (row.frequency as HabitFrequency)
      : ({ type: 'daily' } as HabitFrequency)

  return {
    id: row.id,
    title: row.title,
    targetValue: row.target_value === null ? '' : String(row.target_value),
    taskTime: row.task_time,
    duration: row.duration,
    frequency
  }
}

type HabitLogRow = {
  id: string
  habit_id: string | null
  completed_at: string | null
}

function mapHabitLog(row: HabitLogRow): HabitLogRecord {
  return {
    id: row.id,
    habitId: row.habit_id ?? '',
    completedAt: row.completed_at ?? ''
  }
}

type GoalOverviewRow = {
  id: string
  title: string
  description: string | null
  status: string | null
  priority: number | null
  category_id: string | null
  category: { id: string; name: string } | null
  months: Array<{
    id: string
    title: string
    month: string | null
    days: Array<{ id: string; title: string; day: string; status: string | null }>
  }>
}

function mapGoal(row: GoalOverviewRow): GoalItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status ?? 'active',
    priority: row.priority,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    months: (row.months ?? []).map((month) => ({
      id: month.id,
      title: month.title,
      month: month.month,
      days: (month.days ?? []).map((day) => ({
        id: day.id,
        title: day.title,
        day: day.day,
        status: day.status
      }))
    }))
  }
}

type SummaryRow = {
  id: string
  kind: string | null
  period_start: string | null
  title: string | null
  content: unknown
}

function mapSummary(row: SummaryRow): SummaryRecord {
  const content: Record<string, string> = {}

  if (row.content && typeof row.content === 'object') {
    for (const [key, value] of Object.entries(row.content as Record<string, unknown>)) {
      if (value === null || value === undefined) continue
      content[key] = typeof value === 'string' ? value : String(value)
    }
  }

  return {
    id: row.id,
    kind: (row.kind as SummaryKind) ?? 'daily',
    // 后端已把 period_start 裁成本地日期字符串
    dateKey: (row.period_start ?? '').slice(0, 10),
    title: row.title ?? '',
    content
  }
}

/* ------------------------------- 任务 ------------------------------- */

export async function listTasksForDate(date: Date): Promise<TaskRecord[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const rows = await apiRequest<TaskRow[]>('/tasks', {
    query: { start: start.toISOString(), end: end.toISOString() }
  })

  return rows.map(mapTask)
}

export async function createTask(input: {
  title: string
  notes?: string
  startAt?: string | null
  endAt?: string | null
}): Promise<TaskRecord> {
  const row = await apiRequest<TaskRow>('/tasks', {
    method: 'POST',
    body: {
      title: input.title.trim(),
      description: input.notes ?? '',
      start_time: input.startAt ?? null,
      end_time: input.endAt ?? null
    }
  })

  return mapTask(row)
}

export async function toggleTaskComplete(taskId: string, completed: boolean): Promise<TaskRecord> {
  const row = await apiRequest<TaskRow>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: { completed }
  })

  return mapTask(row)
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' })
}

/* ------------------------------ 日计划 ------------------------------ */

export async function listDailyPlansForDate(dateKey: string): Promise<DailyPlanRecord[]> {
  const rows = await apiRequest<GoalDayRow[]>('/goal-days/by-date', { query: { date: dateKey } })
  return rows.map(mapDailyPlan)
}

export async function toggleDailyPlanComplete(planId: string, completed: boolean): Promise<void> {
  await apiRequest(`/goal-days/${planId}`, {
    method: 'PATCH',
    body: { status: completed ? 'completed' : 'active' }
  })
}

/* ------------------------------- 习惯 ------------------------------- */

export async function listHabits(): Promise<HabitRecord[]> {
  const rows = await apiRequest<HabitRow[]>('/habits')
  return rows.map(mapHabit)
}

export async function listHabitLogsBetween(start: Date, end: Date): Promise<HabitLogRecord[]> {
  const rows = await apiRequest<HabitLogRow[]>('/habits/logs', {
    query: { start: start.toISOString(), end: end.toISOString() }
  })

  return rows.map(mapHabitLog)
}

export async function createHabitLog(habitId: string, date: Date): Promise<void> {
  await apiRequest(`/habits/${habitId}/logs`, {
    method: 'POST',
    body: { completed_at: date.toISOString(), log: '' }
  })
}

export async function deleteHabitLog(logId: string): Promise<void> {
  await apiRequest(`/habits/logs/${logId}`, { method: 'DELETE' })
}

export async function createHabit(input: {
  title: string
  frequency: HabitFrequency
  targetValue: number
}): Promise<HabitRecord> {
  const row = await apiRequest<HabitRow>('/habits', {
    method: 'POST',
    body: {
      title: input.title.trim(),
      frequency: input.frequency,
      target_value: input.targetValue
    }
  })

  return mapHabit(row)
}

/* ------------------------------- 方向 ------------------------------- */

export async function listGoalOverview(): Promise<GoalItem[]> {
  const rows = await apiRequest<GoalOverviewRow[]>('/goals/overview')
  return rows.map(mapGoal)
}

export async function listGoalCategories(): Promise<GoalCategory[]> {
  const rows = await apiRequest<Array<{ id: string; name: string }>>('/goal-categories')
  return rows.map((row) => ({ id: row.id, name: row.name }))
}

export async function createGoal(input: {
  title: string
  description?: string
  categoryId?: string | null
}): Promise<void> {
  await apiRequest('/goals', {
    method: 'POST',
    body: {
      title: input.title.trim(),
      description: input.description ?? null,
      ...(input.categoryId ? { category_id: input.categoryId } : {})
    }
  })
}

export async function toggleGoalDay(goalDayId: string, completed: boolean): Promise<void> {
  await apiRequest(`/goal-days/${goalDayId}`, {
    method: 'PATCH',
    body: { status: completed ? 'completed' : 'active' }
  })
}

/* ------------------------------- 总结 ------------------------------- */

export async function listSummaries(kind: SummaryKind): Promise<SummaryRecord[]> {
  const rows = await apiRequest<SummaryRow[]>('/summaries', { query: { kind } })
  return rows.map(mapSummary)
}

export async function getSummaryByDate(
  dateKey: string,
  kind: SummaryKind
): Promise<SummaryRecord | null> {
  const row = await apiRequest<SummaryRow | null>('/summaries/by-date', {
    query: { date: dateKey, kind }
  })

  return row ? mapSummary(row) : null
}

export async function saveSummary(input: {
  id: string | null
  kind: SummaryKind
  dateKey: string
  title: string
  content: Record<string, string>
}): Promise<SummaryRecord> {
  if (input.id) {
    const row = await apiRequest<SummaryRow>(`/summaries/${input.id}`, {
      method: 'PATCH',
      body: {
        period_start: input.dateKey,
        period_end: input.dateKey,
        title: input.title,
        content: input.content
      }
    })

    return mapSummary(row)
  }

  const row = await apiRequest<SummaryRow>('/summaries', {
    method: 'POST',
    body: {
      kind: input.kind,
      period_start: input.dateKey,
      period_end: input.dateKey,
      title: input.title,
      content: input.content
    }
  })

  return mapSummary(row)
}
