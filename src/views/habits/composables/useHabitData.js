import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

export function useHabitData() {
    const dateStore = useDateStore()

    // 页面级 loading 状态
    const isPageLoading = ref(false)

    // 存储所有的习惯列表数据（包含已归档）
    const allHabits = ref([])

    // 向外暴露的活跃习惯（过滤掉已归档）
    const habits = computed(() => allHabits.value.filter(h => !h.is_archived))
    // 向外暴露的已归档习惯
    const archivedHabits = computed(() => allHabits.value.filter(h => h.is_archived))

    // 存储当前用户在左侧列表选中的某项具体习惯对象
    const selectedHabit = ref(null)

    // 存储当前选中习惯的日志
    const currentHabitLogs = ref([])

    // 用于独立于全局真实时间，在日历上专门控制显示当前“查看的”年份和月份
    const viewYear = ref(dateStore.currentDate.getFullYear())
    const viewMonth = ref(dateStore.currentDate.getMonth())

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

            selectedHabit.value = {
                ...selectedHabit.value,
                monthlyLogs,
                completedDays
            }
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

    const fetchHabits = async () => {
        isPageLoading.value = true
        try {
            const rawHabits = await db.habit.list()
            allHabits.value = rawHabits.map((h) => {
                return {
                    ...h,
                    completedDays: [],   // 等待日志加载后由 selectedHabit 计算
                    logs: [],
                    monthlyLogs: [],
                    total: 0,
                    completionRate: 0,
                    streak: 0
                }
            })

            // 维持选中状态
            if (selectedHabit.value) {
                const updated = allHabits.value.find((h) => h.id === selectedHabit.value.id)
                if (updated) selectedHabit.value = updated
                else selectedHabit.value = null
            } else if (habits.value.length > 0) {
                selectedHabit.value = habits.value[0]
            } else if (archivedHabits.value.length > 0) {
                selectedHabit.value = archivedHabits.value[0]
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
            const habit = allHabits.value.find(h => h.id === habitId)
            if (habit) {
                const viewYearVal = viewYear.value
                const viewMonthVal = viewMonth.value

                const monthlyLogs = logs.filter((log) => {
                    const d = new Date(log.completed_at)
                    return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
                })

                const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

                const updatedHabit = {
                    ...habit,
                    logs,
                    monthlyLogs,
                    completedDays,
                    total: logs.length,
                    completionRate: Math.round((logs.length / 30) * 100),
                    streak: calculateStreak(logs)
                }

                // 更新 allHabits 中的数据，selectedHabit 会自动通过 computed 关联到 allHabits
                const index = allHabits.value.findIndex(h => h.id === habitId)
                if (index !== -1) {
                    allHabits.value[index] = updatedHabit
                }
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
