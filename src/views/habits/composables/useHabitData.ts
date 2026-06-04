// useHabitData.ts
// 习惯模块的数据管理层，负责列表加载、选中状态和日志联动

import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { useHabitStore } from '@/stores/habitStore'
import type { HabitLog as DbHabitLog } from '@/services/db/habit'
import type { AugmentedHabit } from '@/types/models'

// 日历月份上下文，用于月份切换时的数据联动
export interface ViewContext {
  year: number
  month: number
}

// useHabitData composable 的返回值类型
export interface UseHabitDataReturn {
  habits: ComputedRef<AugmentedHabit[]>
  archivedHabits: ComputedRef<AugmentedHabit[]>
  selectedHabit: ComputedRef<AugmentedHabit | null>
  setSelectedHabit: (habit: AugmentedHabit | null) => void
  viewYear: Ref<number>
  viewMonth: Ref<number>
  handleMonthChange: (payload: ViewContext) => void
  fetchHabits: () => Promise<void>
  fetchLogsForHabit: (habitId: string | number | null) => Promise<void>
  isPageLoading: Ref<boolean>
}

/**
 * 习惯数据管理
 *
 * 使用场景：Habits 模块页面，管理习惯列表、选中状态、日志拉取
 * 数据流：Supabase → habitStore → 组件；日志数据由本 composable 独立拉取并 patch 回 store
 */
export function useHabitData(): UseHabitDataReturn {
    const dateStore = useDateStore()
    const habitStore = useHabitStore()

    // 页面级 loading 状态，控制骨架屏展示
    const isPageLoading: Ref<boolean> = ref(false)

    // 活跃习惯列表（已过滤归档项）
    const habits: ComputedRef<AugmentedHabit[]> = computed(() => habitStore.habits)

    // 已归档习惯列表，从 habitStore 响应式读取
    const archivedHabits: ComputedRef<AugmentedHabit[]> = computed(() => habitStore.archivedHabits)

    // 当前选中习惯的全量日志，独立于 habitStore 存储，避免交叉污染
    const currentHabitLogs: Ref<DbHabitLog[]> = ref([])

    // 独立于系统真实时间的"查看中"年月，用于日历翻页时不干扰全局日期状态
    const viewYear: Ref<number> = ref(dateStore.currentDate.getFullYear())
    const viewMonth: Ref<number> = ref(dateStore.currentDate.getMonth())

    // 当前选中的习惯对象，从 habitStore 响应式读取
    const selectedHabit: ComputedRef<AugmentedHabit | null> = computed(() => habitStore.selectedHabit)

    // 设置当前选中的习惯，null 表示取消选中
    const setSelectedHabit = (habit: AugmentedHabit | null): void => {
        habitStore.setSelectedHabitId(habit ? String(habit.id) : null)
    }

    // 日历月份切换时的联动处理：更新本地月份状态，并刷新当前选中习惯的月度统计
    const handleMonthChange = ({ year, month }: ViewContext): void => {
        viewYear.value = year
        viewMonth.value = month
        // 月份切换时不重新拉取数据，直接在内存中按新月份过滤，减少网络请求
        if (selectedHabit.value && currentHabitLogs.value.length > 0) {
            const viewYearVal = year
            const viewMonthVal = month

            const monthlyLogs = currentHabitLogs.value.filter((log) => {
                const d = new Date(log.completed_at!)
                return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
            })

            const completedDays = monthlyLogs.map((log) => new Date(log.completed_at!).getDate())

            // patchHabit 接受 Partial<AugmentedHabit>，支持日志统计字段的局部更新
            habitStore.patchHabit(String(selectedHabit.value.id), {
                monthlyLogs,
                completedDays
            })
        }
    }

    // 从今天或昨天开始计算连续打卡天数，支持"昨天打了今天没打"的场景
    const calculateStreak = (logs: DbHabitLog[]): number => {
  if (!logs || logs.length === 0) return 0

  // 去重并按日期倒序排列，便于从最近一天向前遍历
  const sortedDates = [...new Set(
    logs.map(log => new Date(log.completed_at!).toDateString())
  )].sort().reverse()

  if (sortedDates.length === 0) return 0

  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // 只从今天或昨天开始计算连击，避免中间断开多天仍算连击
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
      break // 遇到更早的日期说明连击已中断
    }
  }

  return streak
}

    // 从 habitStore 拉取习惯列表，并为每项补充日志相关的占位字段
    const fetchHabits = async (): Promise<void> => {
        isPageLoading.value = true
        try {
            await habitStore.fetchHabits()

            // 为每个习惯补充日志相关字段的默认值，防止后续计算中访问 undefined
            const all = habitStore.allHabits
            all.forEach((h, index) => {
                all[index] = {
                    ...h,
                    completedDays: h.completedDays || [],
                    logs: h.logs || [],
                    monthlyLogs: h.monthlyLogs || [],
                    total: h.total || 0,
                    completionRate: h.completionRate || 0,
                    streak: h.streak || 0
                }
            })

            // 刷新后维持选中状态：优先选中之前选中的习惯，否则选中列表第一个
            if (selectedHabit.value) {
                const updated = all.find(h => h.id === selectedHabit.value!.id)
                if (updated) habitStore.setSelectedHabitId(String(updated.id))
                else habitStore.setSelectedHabitId(String(habitStore.habits[0]?.id || habitStore.archivedHabits[0]?.id || ''))
            } else if (habitStore.habits.length > 0) {
                habitStore.setSelectedHabitId(String(habitStore.habits[0]!.id))
            } else if (habitStore.archivedHabits.length > 0) {
                habitStore.setSelectedHabitId(String(habitStore.archivedHabits[0]!.id))
            }
        } catch (e) {
            console.error('Fetch habits failed', e)
        } finally {
            isPageLoading.value = false
        }
    }

    // 拉取指定习惯的全量日志，并根据当前查看月份计算月度统计后 patch 回 store
    const fetchLogsForHabit = async (habitId: string | number | null): Promise<void> => {
        if (!habitId) {
            currentHabitLogs.value = []
            return
        }

        try {
            const logs = await db.habit.listLogsByHabit(habitId)
            currentHabitLogs.value = logs

            const habit = habitStore.allHabits.find(h => h.id === habitId)
            if (habit) {
                const viewYearVal = viewYear.value
                const viewMonthVal = viewMonth.value

                // 按当前查看月份过滤日志，用于日历热力图展示
                const monthlyLogs = logs.filter((log) => {
                    const d = new Date(log.completed_at!)
                    return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
                })

                const completedDays = monthlyLogs.map((log) => new Date(log.completed_at!).getDate())

                // patchHabit 接受 Partial<AugmentedHabit>，支持日志统计字段的局部更新
                habitStore.patchHabit(String(habitId), {
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
        setSelectedHabit,
        viewYear,
        viewMonth,
        handleMonthChange,
        fetchHabits,
        fetchLogsForHabit,
        isPageLoading
    }
}

/**
 * 乐观更新辅助：构建带新打卡记录的临时习惯对象
 *
 * 在数据库写入前先更新 UI，写入失败时由调用方回滚。
 * 不修改原始对象，返回全新引用以触发响应式更新。
 */
export function buildPatchedHabit(habit: AugmentedHabit, newLog: DbHabitLog | null, viewContext: ViewContext): AugmentedHabit {
  if (!newLog) return habit

  const logs = [newLog, ...(habit.logs || [])]
  const monthlyLogs = logs.filter((log) => {
    const date = new Date(log.completed_at!)
    return date.getFullYear() === viewContext.year && date.getMonth() === viewContext.month
  })

  return {
    ...habit,
    logs,
    monthlyLogs,
    completedDays: monthlyLogs.map((log) => new Date(log.completed_at!).getDate()),
    total: logs.length
  }
}
