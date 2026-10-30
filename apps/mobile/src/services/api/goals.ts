import { apiRequest } from './client'

/**
 * 方向模块：goal（年度）→ goal_months（月度）→ goal_days（日）。
 *
 * 后端 `/goals/overview` 一次返回三级嵌套，前端不再逐级请求。
 */

export type GoalStatus = 'active' | 'completed' | 'archived'

export type GoalDayItem = {
  id: string
  title: string
  day: string
  status: string | null
  taskTime: string | null
  duration: number | null
}

export type GoalMonthItem = {
  id: string
  title: string
  month: string | null
  status: string | null
  days: GoalDayItem[]
}

export type GoalItem = {
  id: string
  title: string
  description: string
  status: GoalStatus
  priority: number | null
  categoryId: string | null
  categoryName: string | null
  months: GoalMonthItem[]
}

export type GoalCategory = {
  id: string
  name: string
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
    status: string | null
    days: Array<{
      id: string
      title: string
      day: string
      status: string | null
      task_time: string | null
      duration: number | null
    }>
  }>
}

function mapStatus(value: string | null): GoalStatus {
  if (value === 'completed' || value === 'archived') return value
  return 'active'
}

function mapGoal(row: GoalOverviewRow): GoalItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: mapStatus(row.status),
    priority: row.priority,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    months: (row.months ?? []).map((month) => ({
      id: month.id,
      title: month.title,
      month: month.month,
      status: month.status,
      days: (month.days ?? []).map((day) => ({
        id: day.id,
        title: day.title,
        day: day.day,
        status: day.status,
        taskTime: day.task_time,
        duration: day.duration
      }))
    }))
  }
}

export async function listGoalOverview(): Promise<GoalItem[]> {
  const rows = await apiRequest<GoalOverviewRow[]>('/goals/overview')
  return rows.map(mapGoal)
}

type CategoryRow = { id: string; name: string }

export async function listGoalCategories(): Promise<GoalCategory[]> {
  const rows = await apiRequest<CategoryRow[]>('/goal-categories')
  return rows.map((row) => ({ id: row.id, name: row.name }))
}

export type GoalInput = {
  title: string
  description?: string | null
  category_id?: string | null
  status?: GoalStatus
  priority?: number
}

export async function createGoal(input: GoalInput): Promise<void> {
  await apiRequest('/goals', {
    method: 'POST',
    body: {
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ?? 'active',
      priority: input.priority ?? 2,
      ...(input.category_id ? { category_id: input.category_id } : {})
    }
  })
}

export async function updateGoal(goalId: string, input: Partial<GoalInput>): Promise<void> {
  await apiRequest(`/goals/${goalId}`, { method: 'PATCH', body: input })
}

export async function deleteGoal(goalId: string): Promise<void> {
  await apiRequest(`/goals/${goalId}`, { method: 'DELETE' })
}

/** 日目标勾选：status 是 varchar 枚举，与 goal_days 表一致 */
export async function toggleGoalDay(goalDayId: string, completed: boolean): Promise<void> {
  await apiRequest(`/goal-days/${goalDayId}`, {
    method: 'PATCH',
    body: { status: completed ? 'completed' : 'active' }
  })
}
