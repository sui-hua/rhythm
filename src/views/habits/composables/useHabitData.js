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
 *
 * 负责获取习惯列表数据、维护当前选中习惯、以及管理日历视图的年份和月份状态。
 * 该 Composable 是 Habits 模块的数据中枢，协调数据库读取、状态管理和视图联动。
 *
 * @returns {Object} 包含以下属性：
 *   - habits: 活跃习惯列表（过滤已归档）
 *   - archivedHabits: 已归档习惯列表
 *   - selectedHabit: 当前选中的习惯对象
 *   - viewYear: 日历视图当前年份
 *   - viewMonth: 日历视图当前月份
 *   - handleMonthChange: 月份切换处理函数
 *   - fetchHabits: 加载习惯列表核心方法
 *   - fetchLogsForHabit: 加载指定习惯打卡记录
 *   - isPageLoading: 页面级加载状态
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
     * 处理日历月份切换事件
     *
     * 当用户在日历视图进行月份翻页时调用，用于更新 viewYear 和 viewMonth，
     * 同时重新计算当前选中习惯的 completedDays 和 monthlyLogs。
     * 注意：该方法不会重新从数据库获取数据，仅在内存中进行过滤计算。
     *
     * @param {Object} payload - 包含 year 和 month 的月份切换参数
     * @param {number} payload.year - 目标年份
     * @param {number} payload.month - 目标月份（0-11）
     * @returns {void}
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
     * 计算习惯连续打卡天数（连击数）
     *
     * 算法逻辑：
     * 1. 将打卡记录按日期去重并降序排序
     * 2. 判断最近一次打卡是今天还是昨天，如果不是则连击中断返回 0
     * 3. 从最近一次打卡开始向前遍历，计算连续天数
     * 4. 遇到日期不连续的情况则中断计数
     *
     * @param {Array<Object>} logs - 该习惯的所有打卡记录数组，每条记录应包含 completed_at 字段
     * @returns {number} 连续打卡天数（连击数），如果记录为空或最近打卡不是今天/昨天则返回 0
     */
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

    /**
     * 从数据库加载习惯列表
     *
     * 核心异步方法，负责：
     * 1. 从数据库获取所有习惯数据（包括活跃和已归档）
     * 2. 初始化每个习惯的统计数据字段（completedDays、logs、monthlyLogs 等）
     * 3. 维持当前选中习惯的选中状态（如果选中项被删除则自动降级选择）
     *
     * @returns {Promise<void>} 无返回值，通过修改 allHabits 等 ref 更新状态
     */
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

    /**
     * 获取指定习惯的所有打卡记录并更新相关统计
     *
     * 根据 habitId 从数据库加载该习惯的全部打卡日志，然后：
     * 1. 计算当月（viewYear/viewMonth）的月度日志 monthlyLogs
     * 2. 提取当月已打卡的天数数组 completedDays
     * 3. 计算累计打卡次数 total、完成率 completionRate、连击数 streak
     * 4. 更新 allHabits 中对应习惯的数据（selectedHabit 通过 computed 关联自动更新）
     *
     * @param {string} habitId - 目标习惯的唯一标识符
     * @returns {Promise<void>} 无返回值，通过修改 currentHabitLogs 和 allHabits 更新状态
     */
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

/**
 * 构建带新打卡记录的临时习惯对象（乐观更新）
 *
 * 在用户点击完成/取消完成时，无需重新查询数据库即可更新界面数据。
 * 该函数用于 optimistic update 场景，在发起实际请求前先更新 UI。
 *
 * 算法流程：
 * 1. 将新日志 prepend 到 logs 数组头部
 * 2. 根据 viewContext 过滤出当月月度日志 monthlyLogs
 * 3. 重新计算 completedDays（当月已打卡天数数组）
 *
 * @param {Object} habit - 当前习惯对象
 * @param {Object|null} newLog - 新增的打卡记录（若为 null 则直接返回原 habit）
 * @param {Object} viewContext - 视图上下文，用于过滤月度日志
 * @param {number} viewContext.year - 目标年份
 * @param {number} viewContext.month - 目标月份（0-11）
 * @returns {Object} 更新后的习惯对象（不含 streak 和 completionRate，需外部重新计算）
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
