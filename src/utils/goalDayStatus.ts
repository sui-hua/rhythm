// goal_days.status uses smallint: 0 = pending, 1 = completed.

export function isGoalDayCompleted(status: number): boolean {
  return status === 1
}

export function toGoalDayStatus(completed: boolean): number {
  return completed ? 1 : 0
}
