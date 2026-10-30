import type { GoalItem, GoalMonthItem } from './api'

/**
 * 目标进度：口径与 web 端 `views/direction/utils/progress.ts` 一致，
 * 以 goal_days.status === 'completed' 为唯一完成依据。
 */

export function isGoalDayCompleted(status: string | null | undefined): boolean {
  return status === 'completed'
}

export function goalProgress(goal: GoalItem): number {
  const days = goal.months.flatMap((month) => month.days)
  if (days.length === 0) return goal.status === 'completed' ? 1 : 0

  const done = days.filter((day) => isGoalDayCompleted(day.status)).length
  return done / days.length
}

export function goalStage(goal: GoalItem): 'completed' | 'inProgress' | 'notStarted' {
  if (goal.status === 'completed') return 'completed'
  return goalProgress(goal) > 0 ? 'inProgress' : 'notStarted'
}

export function goalStats(goals: GoalItem[]) {
  let completed = 0
  let inProgress = 0
  let notStarted = 0

  for (const goal of goals) {
    const stage = goalStage(goal)
    if (stage === 'completed') completed++
    else if (stage === 'inProgress') inProgress++
    else notStarted++
  }

  return { completed, inProgress, notStarted }
}

export function goalSortRank(goal: GoalItem): number {
  const stage = goalStage(goal)
  if (stage === 'inProgress') return 0
  if (stage === 'completed') return 2
  return 3
}

export function goalMonthProgress(month: GoalMonthItem) {
  const total = month.days.length
  const done = month.days.filter((day) => isGoalDayCompleted(day.status)).length
  return { done, total }
}

/** 2026-10-01 → 2026 年 10 月 */
export function formatMonthLabel(month: string | null): string {
  if (!month) return '未命名月份'
  const [year, monthPart] = month.split('-')
  return `${year} 年 ${Number(monthPart)} 月`
}
