export const getDirectionMonthPrefix = (month) => String(month)

export const getDirectionMonthlyProgress = ({
  dailyTasks,
  planId,
  month,
  isDailyPlanCompleted
}) => {
  if (!planId || !month) return 0

  const monthPrefix = getDirectionMonthPrefix(month)
  let total = 0
  let completed = 0

  for (const [key, task] of Object.entries(dailyTasks)) {
    if (key.startsWith(`plan-${planId}-${monthPrefix}-`)) {
      total++
      if (isDailyPlanCompleted(task.status)) completed++
    }
  }

  return total === 0 ? 0 : Math.round((completed / total) * 100)
}
