import type { TaskRecord } from '@/domain/tasks/types'
import type { DailyPlanRecord, DayExecutionItem, HabitLogRecord, HabitRecord } from './types'
import { addMinutes, formatMinutesAsClock, parseClockToMinutes, parseIsoToDayMinutes } from './time'

type BuildInput = {
  tasks: TaskRecord[]
  dailyPlans: DailyPlanRecord[]
  habits: HabitRecord[]
  habitLogs: HabitLogRecord[]
}

const sourceRank = {
  daily_plan: 0,
  task: 1,
  habit: 2
} satisfies Record<DayExecutionItem['source'], number>

export function isDailyPlanCompleted(status: DailyPlanRecord['status']) {
  return status === 'completed'
}

export function buildDayExecutionItems(input: BuildInput) {
  const habitLogIds = new Set(input.habitLogs.map((log) => log.habitId))

  const taskItems = input.tasks.map(toTaskItem)
  const dailyPlanItems = input.dailyPlans.map(toDailyPlanItem)
  const habitItems = input.habits.map((habit) => toHabitItem(habit, habitLogIds.has(habit.id)))

  return [...taskItems, ...dailyPlanItems, ...habitItems].sort(compareExecutionItems)
}

export function splitExecutionItems(items: DayExecutionItem[]) {
  return {
    scheduledItems: items.filter((item) => item.startMinutes !== null),
    unscheduledItems: items.filter((item) => item.startMinutes === null)
  }
}

function toTaskItem(task: TaskRecord): DayExecutionItem {
  const startMinutes = parseIsoToDayMinutes(task.startAt)
  const endMinutes = parseIsoToDayMinutes(task.endAt)

  return {
    id: task.id,
    source: 'task',
    title: task.title,
    description: task.notes,
    startAt: task.startAt,
    endAt: task.endAt,
    startMinutes,
    durationMinutes: startMinutes !== null && endMinutes !== null ? endMinutes - startMinutes : null,
    completed: task.completed,
    categoryLabel: '个人任务',
    readonly: false,
    original: task
  }
}

function toDailyPlanItem(plan: DailyPlanRecord): DayExecutionItem {
  const inheritedTime = plan.taskTime ?? plan.monthlyPlan?.taskTime ?? plan.monthlyPlan?.plan?.taskTime ?? null
  const inheritedDuration = plan.duration ?? plan.monthlyPlan?.duration ?? plan.monthlyPlan?.plan?.duration ?? null
  const startMinutes = parseClockToMinutes(inheritedTime)
  const endMinutes = addMinutes(startMinutes, inheritedDuration)

  return {
    id: plan.id,
    source: 'daily_plan',
    title: plan.title,
    description: plan.description,
    startAt: startMinutes === null ? null : formatMinutesAsClock(startMinutes),
    endAt: endMinutes === null ? null : formatMinutesAsClock(endMinutes),
    startMinutes,
    durationMinutes: inheritedDuration,
    completed: isDailyPlanCompleted(plan.status),
    categoryLabel: '今日计划',
    readonly: true,
    original: plan
  }
}

function toHabitItem(habit: HabitRecord, completed: boolean): DayExecutionItem {
  const startMinutes = parseClockToMinutes(habit.taskTime)
  const duration = habit.duration ?? (startMinutes === null ? null : 30)
  const endMinutes = addMinutes(startMinutes, duration)

  return {
    id: habit.id,
    source: 'habit',
    title: habit.title,
    description: habit.targetValue ? `目标：${habit.targetValue}` : '',
    startAt: startMinutes === null ? null : formatMinutesAsClock(startMinutes),
    endAt: endMinutes === null ? null : formatMinutesAsClock(endMinutes),
    startMinutes,
    durationMinutes: duration,
    completed,
    categoryLabel: '日常习惯',
    readonly: true,
    original: habit
  }
}

function compareExecutionItems(a: DayExecutionItem, b: DayExecutionItem) {
  if (a.startMinutes !== null && b.startMinutes !== null) {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes
    return sourceRank[a.source] - sourceRank[b.source]
  }

  if (a.startMinutes !== null) return -1
  if (b.startMinutes !== null) return 1

  return sourceRank[a.source] - sourceRank[b.source]
}