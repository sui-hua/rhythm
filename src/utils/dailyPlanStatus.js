// daily_plans.status uses smallint: 0 = pending, 1 = completed.

export function isDailyPlanCompleted(status) {
  return status === 1
}

export function toDailyPlanStatus(completed) {
  return completed ? 1 : 0
}
