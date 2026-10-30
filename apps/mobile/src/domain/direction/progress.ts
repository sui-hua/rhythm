/**
 * 方向页进度计算。
 *
 * 口径与 web 端 `views/direction/utils/progress.ts` 一致：
 * 以 goal_days 的 status 为唯一完成依据，按「已完成日数 / 总日数」取比例。
 * 这里用结构化类型，避免领域层反向依赖 API 层。
 */

export type GoalDayLike = {
  status: string | null
}

export type GoalMonthLike = {
  days: GoalDayLike[]
}

export type GoalLike = {
  status: string
  months: GoalMonthLike[]
}

/** goal_days.status 是 varchar 枚举，只有 'completed' 算完成 */
export function isGoalDayCompleted(status: string | null | undefined): boolean {
  return status === 'completed'
}

/** 目标总进度（0–1）。目标被标记完成时直接算 100%，与 web 端展示一致 */
export function goalProgress(goal: GoalLike): number {
  const days = goal.months.flatMap((month) => month.days)

  if (days.length === 0) return goal.status === 'completed' ? 1 : 0

  const done = days.filter((day) => isGoalDayCompleted(day.status)).length
  return done / days.length
}

/** 单个目标所属的阶段：已完成 / 进行中 / 待开始 */
export function goalStage(goal: GoalLike): 'completed' | 'inProgress' | 'notStarted' {
  if (goal.status === 'completed') return 'completed'
  return goalProgress(goal) > 0 ? 'inProgress' : 'notStarted'
}

export function goalStats(goals: GoalLike[]) {
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

/** 列表排序权重：进行中（0）→ 已完成（2）→ 待开始（3） */
export function goalSortRank(goal: GoalLike): number {
  const stage = goalStage(goal)
  if (stage === 'inProgress') return 0
  if (stage === 'completed') return 2
  return 3
}

/** 月度进度，用于详情页每个月的完成比例 */
export function goalMonthProgress(month: GoalMonthLike): { done: number; total: number } {
  const total = month.days.length
  const done = month.days.filter((day) => isGoalDayCompleted(day.status)).length
  return { done, total }
}
