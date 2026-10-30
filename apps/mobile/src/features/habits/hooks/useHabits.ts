import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addDays, getWeekStart } from '@/domain/day/time'
import { buildHabitLogIndex } from '@/domain/habits/stats'
import { listHabitLogsBetween, listHabits } from '@/services/api/habits'

/** 热力图覆盖的周数，与详情页排版一致 */
export const HABIT_HEATMAP_WEEKS = 15

/**
 * 习惯页数据。
 *
 * 习惯列表本身不分日期，只查一次；打卡记录按「热力图窗口」一次拉区间，
 * 前端归约成 habitId → 日期集合后，连续天数 / 本周次数 / 热力图全部本地算完。
 */
export function useHabits() {
  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: () => listHabits()
  })

  // 热力图窗口：本周周一往前推 (weeks - 1) 周
  const range = useMemo(() => {
    const today = new Date()
    const start = addDays(getWeekStart(today), -7 * (HABIT_HEATMAP_WEEKS - 1))
    start.setHours(0, 0, 0, 0)

    const end = new Date(today)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }, [])

  const logsQuery = useQuery({
    queryKey: ['habit-logs', 'heatmap', range.start.toISOString(), range.end.toISOString()],
    queryFn: () => listHabitLogsBetween(range.start, range.end)
  })

  const logIndex = useMemo(() => buildHabitLogIndex(logsQuery.data ?? []), [logsQuery.data])

  return {
    habits: habitsQuery.data ?? [],
    logIndex,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    errors: [habitsQuery.error, logsQuery.error].filter(Boolean),
    refetch: () => {
      void habitsQuery.refetch()
      void logsQuery.refetch()
    }
  }
}
