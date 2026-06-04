// useHabitStats.ts
// 习惯模块的统计指标计算，驱动统计面板展示

import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import type { AugmentedHabit } from '@/types/models'

// 统计指标项，用于统计面板的单行展示
export interface StatItem {
  label: string
  value: number
  unit: string
}

// useHabitStats composable 的返回值类型
export interface UseHabitStatsReturn {
  todayCompletionRate: ComputedRef<number>
  habitStats: ComputedRef<StatItem[]>
}

/**
 * 习惯统计指标计算
 *
 * 使用场景：Habits 模块的统计面板，展示今日完成率和选中习惯的详细指标
 * 数据流：habits / selectedHabit (Ref) → computed 计算 → 组件展示
 *
 * @param habits - 活跃习惯列表（来自 useHabitData）
 * @param selectedHabit - 当前选中的习惯（来自 useHabitData）
 * @returns 统计相关的计算属性
 */
export function useHabitStats(
  habits: Ref<AugmentedHabit[]>,
  selectedHabit: Ref<AugmentedHabit | null>
): UseHabitStatsReturn {
    const dateStore = useDateStore()

    // 今日完成率：使用系统真实时间，不受日历翻页影响
    const todayCompletionRate: ComputedRef<number> = computed(() => {
        if (!habits.value || habits.value.length === 0) return 0
        // 直接使用系统真实今天，与日历的 viewYear/viewMonth 解耦
        const todayDate = new Date()
        const currentYear = todayDate.getFullYear()
        const currentMonth = todayDate.getMonth()
        const currentDay = todayDate.getDate()

        // 遍历习惯列表，检查每项在今日是否有打卡记录
        const completedTodayCount = habits.value.filter((h) => {
            if (!h.logs || !Array.isArray(h.logs)) return false
            // 使用全量 logs 而非 monthlyLogs，避免月份切换导致数据不一致
            return h.logs.some((log) => {
                const logDate = new Date(log.completed_at!)
                return logDate.getFullYear() === currentYear &&
                    logDate.getMonth() === currentMonth &&
                    logDate.getDate() === currentDay
            })
        }).length

        return Math.round((completedTodayCount / habits.value.length) * 100)
    })

    // 当前选中习惯的各项统计指标，用于详情面板展示
    const habitStats: ComputedRef<StatItem[]> = computed(() => {
        // 未选中习惯时返回空数组，避免访问 null 的深层属性导致异常
        if (!selectedHabit.value) return []

        return [
            { label: '本月打卡', value: selectedHabit.value.completedDays.length, unit: '天' },
            { label: '年度总计', value: selectedHabit.value.total, unit: '天' },
            { label: '周期完成率', value: selectedHabit.value.completionRate, unit: '%' },
            { label: '当前连击', value: selectedHabit.value.streak, unit: '天' }
        ]
    })

    return {
        todayCompletionRate,
        habitStats
    }
}
