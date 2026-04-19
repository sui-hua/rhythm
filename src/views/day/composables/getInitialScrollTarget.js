const DEFAULT_HOUR = 8
const STALE_TASK_THRESHOLD_HOURS = 2

const isSameDay = (a, b) => {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export const getInitialScrollTarget = ({
  schedule = [],
  targetDate,
  now = new Date()
} = {}) => {
  if (!schedule.length) {
    return {
      type: 'default-hour',
      hour: DEFAULT_HOUR
    }
  }

  const firstUncompletedIndex = schedule.findIndex(task => !task.completed)
  const targetIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0
  const targetTask = schedule[targetIndex]

  if (!targetDate || !isSameDay(targetDate, now)) {
    return {
      type: 'task',
      index: targetIndex
    }
  }

  const currentHour = now.getHours() + now.getMinutes() / 60
  const taskEndHour = (targetTask.startHour ?? 0) + (targetTask.durationHours || 0)

  if (currentHour - taskEndHour >= STALE_TASK_THRESHOLD_HOURS) {
    return {
      type: 'current-time',
      hour: Math.floor(currentHour)
    }
  }

  return {
    type: 'task',
    index: targetIndex
  }
}

