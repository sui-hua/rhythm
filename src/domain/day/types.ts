import type { TaskRecord } from '@/domain/tasks/types'

export type ExecutionSource = 'task' | 'daily_plan' | 'habit'

export type DailyPlanStatus = 0 | 1 | 'pending' | 'done' | boolean | null

export type DailyPlanRecord = {
  id: string
  title: string
  description: string
  day: string
  taskTime: string | null
  duration: number | null
  status: DailyPlanStatus
  monthlyPlan?: {
    id: string
    taskTime: string | null
    duration: number | null
    plan?: {
      id: string
      taskTime: string | null
      duration: number | null
    } | null
  } | null
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
  isArchived: boolean
}

export type HabitLogRecord = {
  id: string
  habitId: string
  completedAt: string
}

export type DayExecutionItem = {
  id: string
  source: ExecutionSource
  title: string
  description: string
  startAt: string | null
  endAt: string | null
  startMinutes: number | null
  durationMinutes: number | null
  completed: boolean
  categoryLabel: '个人任务' | '今日计划' | '日常习惯'
  readonly: boolean
  original: TaskRecord | DailyPlanRecord | HabitRecord
}