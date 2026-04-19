/**
 * ============================================
 * Habits 模块数据层 (views/habits/composables/useHabitData.js)
 * ============================================
 *
 * 【模块职责】
 * - 获取并管理习惯列表数据
 * - 计算习惯统计数据（连击天数、完成率、总打卡次数）
 * - 管理日历视图的年份和月份
 *
 * 【数据结构 - Habit】
 * - id: 习惯唯一标识
 * - title: 习惯名称
 * - completedDays: 本月已打卡的天数数组
 * - logs: 所有历史打卡记录
 * - monthlyLogs: 本月打卡记录
 * - total: 累计打卡次数
 * - completionRate: 完成率（基于 30 天计算）
 * - streak: 连击天数
 *
 * 【统计数据计算】
 * - calculateStreak() → 从今天或昨天开始计算连续打卡天数
 */
import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

/**
 * 习惯数据管理核心逻辑 (Composable)
 * 负责获取习惯列表数据、维护当前选中习惯、以及管理日历视图的年份和月份状态。
 */
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

    /**
     * 处理日历月份相互翻页切换的事件
     * @param {Object} payload 包含解构所得的新年份 (year) 和新月份 (month)
     */
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

    /**
     * 简单的连击天数计算逻辑 (当前为简易占位符版本实现)
     * @param {Array} logs - 该习惯的所有打卡记录
     * @returns {number} 连击天数
     */
    const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0

  // 按日期排序（最新的在前）
  const sortedDates = logs
    .map(log => new Date(log.completed_at).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index) // 去重
    .sort((a, b) => new Date(b) - new Date(a)) // 降序

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

    /**
     * 核心异步逻辑：从数据库层拉取最新习惯数据并进行组合加工
     */
    const fetchHabits = async () => {
        isPageLoading.value = true
        try {
            const rawHabits = await db.habits.list()
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

    /**
     * 获取指定习惯的所有打卡记录
     * @param {string} habitId - 习惯 ID
     */
    const fetchLogsForHabit = async (habitId) => {
        if (!habitId) {
            currentHabitLogs.value = []
            return
        }

        try {
            const logs = await db.habits.listLogsByHabit(habitId)
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

/**
 * Patches a habit object with a new log entry without refetching.
 * Used for optimistic updates after toggle complete.
 * @param {Object} habit - Original habit object
 * @param {Object|null} newLog - New log entry to prepend
 * @param {Object} viewContext - { year, month } for filtering monthlyLogs
 * @returns {Object} Patched habit
 */
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
