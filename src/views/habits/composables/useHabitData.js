import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { useHabitStore } from '@/stores/habitStore'

export function useHabitData() {
    const dateStore = useDateStore()
    const habitStore = useHabitStore()

    // 页面级 loading 状态
    const isPageLoading = ref(false)

    // 活跃习惯（从 habitStore 读取，过滤掉已归档）
    const habits = computed(() => habitStore.habits)

    // 已归档习惯（从 habitStore 读取）
    const archivedHabits = computed(() => habitStore.archivedHabits)

    // 存储当前选中习惯的日志
    const currentHabitLogs = ref([])

    // 用于独立于全局真实时间，在日历上专门控制显示当前"查看的"年份和月份
    const viewYear = ref(dateStore.currentDate.getFullYear())
    const viewMonth = ref(dateStore.currentDate.getMonth())

    // 当前选中的习惯对象（从 habitStore 读取）
    const selectedHabit = computed(() => habitStore.selectedHabit)

    const handleMonthChange = ({ year, month }) => {
        viewYear.value = year
        viewMonth.value = month
        // 不再调用 fetchHabits，直接在内存中过滤
        // 但需要重新计算 completedDays 和 monthlyLogs
        if (selectedHabit.value && currentHabitLogs.value.length > 0) {
            const viewYearVal = year
            const viewMonthVal = month

            const monthlyLogs = currentHabitLogs.value.filter((log) => {
                const d = new Date(log.completed_at)
                return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
            })

            const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

            habitStore.patchHabit(selectedHabit.value.id, {
                monthlyLogs,
                completedDays
            })
        }
    }

    // 从今天或昨天开始计算连续打卡天数
    const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0

  const sortedDates = [...new Set(
    logs.map(log => new Date(log.completed_at).toDateString())
  )].sort().reverse()

  if (sortedDates.length === 0) return 0

  // 计算连续天数
  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // 从今天或昨天开始计算
  const startDate = sortedDates[0] === today ? today :
                    sortedDates[0] === yesterday ? yesterday : null

  if (!startDate) return 0

  let currentDate = new Date(startDate)

  for (const dateStr of sortedDates) {
    const expected = currentDate.toDateString()
    if (dateStr === expected) {
      streak++
      currentDate = new Date(currentDate.getTime() - 86400000)
    } else if (new Date(dateStr) < currentDate) {
      break // 连击中断
    }
  }

  return streak
}

    // 从 habitStore 拉取习惯列表，并为每项补充日志相关的占位字段
    const fetchHabits = async () => {
        isPageLoading.value = true
        try {
            await habitStore.fetchHabits()

            // 为每个习惯补充日志相关的占位字段
            habitStore.allHabits.forEach((h, index) => {
                habitStore.allHabits[index] = {
                    ...h,
                    completedDays: h.completedDays || [],
                    logs: h.logs || [],
                    monthlyLogs: h.monthlyLogs || [],
                    total: h.total || 0,
                    completionRate: h.completionRate || 0,
                    streak: h.streak || 0
                }
            })

            // 维持选中状态
            if (selectedHabit.value) {
                const updated = habitStore.allHabits.find((h) => h.id === selectedHabit.value.id)
                if (updated) habitStore.setSelectedHabitId(updated.id)
                else habitStore.setSelectedHabitId(habitStore.habits[0]?.id || habitStore.archivedHabits[0]?.id || null)
            } else if (habitStore.habits.length > 0) {
                habitStore.setSelectedHabitId(habitStore.habits[0].id)
            } else if (habitStore.archivedHabits.length > 0) {
                habitStore.setSelectedHabitId(habitStore.archivedHabits[0].id)
            }
        } catch (e) {
            console.error('Fetch habits failed', e)
        } finally {
            isPageLoading.value = false
        }
    }

    const fetchLogsForHabit = async (habitId) => {
        if (!habitId) {
            currentHabitLogs.value = []
            return
        }

        try {
            const logs = await db.habit.listLogsByHabit(habitId)
            currentHabitLogs.value = logs

            // 找到对应的习惯，更新其 logs 相关字段
            const habit = habitStore.allHabits.find(h => h.id === habitId)
            if (habit) {
                const viewYearVal = viewYear.value
                const viewMonthVal = viewMonth.value

                const monthlyLogs = logs.filter((log) => {
                    const d = new Date(log.completed_at)
                    return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
                })

                const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

                // 通过 habitStore 局部更新
                habitStore.patchHabit(habitId, {
                    logs,
                    monthlyLogs,
                    completedDays,
                    total: logs.length,
                    completionRate: Math.round((logs.length / 30) * 100),
                    streak: calculateStreak(logs)
                })
            }
        } catch (e) {
            console.error('Fetch logs for habit failed', e)
        }
    }

    return {
        habits,
        archivedHabits,
        selectedHabit,
        viewYear,
        viewMonth,
        handleMonthChange,
        fetchHabits,
        fetchLogsForHabit,
        isPageLoading
    }
}

// 乐观更新：构建带新打卡记录的临时习惯对象
export function buildPatchedHabit(habit, newLog, viewContext) {
  if (!newLog) return habit

  const logs = [newLog, ...(habit.logs || [])]
  const monthlyLogs = logs.filter((log) => {
    const date = new Date(log.completed_at)
    return date.getFullYear() === viewContext.year && date.getMonth() === viewContext.month
  })

  return {
    ...habit,
    logs,
    monthlyLogs,
    completedDays: monthlyLogs.map((log) => new Date(log.completed_at).getDate()),
    total: logs.length
  }
}
