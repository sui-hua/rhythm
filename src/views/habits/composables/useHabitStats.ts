import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import type { AugmentedHabit } from '@/types/models'

// 统计指标项
export interface StatItem {
  label: string
  value: number
  unit: string
}

// useHabitStats composable 的返回值接口
export interface UseHabitStatsReturn {
  todayCompletionRate: ComputedRef<number>
  habitStats: ComputedRef<StatItem[]>
}

/**
 * 习惯统计数据 composable
 *
 * 计算今日完成率和当前选中习惯的各项统计指标。
 *
 * @param habits - 活跃习惯列表（Ref）
 * @param selectedHabit - 当前选中的习惯（Ref）
 * @returns 统计相关的计算属性
 */
export function useHabitStats(
  habits: Ref<AugmentedHabit[]>,
  selectedHabit: Ref<AugmentedHabit | null>
): UseHabitStatsReturn {
    const dateStore = useDateStore()

    // 今日完成率：已完成的习惯数 / 总习惯数 * 100
    const todayCompletionRate: ComputedRef<number> = computed(() => {
        // 若尚未加载习惯项目，率值为 0
        if (!habits.value || habits.value.length === 0) return 0
        // 直接抓取系统真实今天，不受日历或其它视图干扰
        const todayDate = new Date()
        const currentYear = todayDate.getFullYear()
        const currentMonth = todayDate.getMonth()
        const currentDay = todayDate.getDate()

        // 遍历习惯列表，检查它们每项在真实系统时间"今日"是否存在打卡记录
        const completedTodayCount = habits.value.filter((h) => {
            // 防御性检查：logs 可能尚未加载
            if (!h.logs || !Array.isArray(h.logs)) return false
            // 使用不受页面翻页控制的全量 logs 过滤
            return h.logs.some((log) => {
                const logDate = new Date(log.completed_at!)
                return logDate.getFullYear() === currentYear &&
                    logDate.getMonth() === currentMonth &&
                    logDate.getDate() === currentDay
            })
        }).length

        return Math.round((completedTodayCount / habits.value.length) * 100)
    })

    // 当前选中习惯的各项统计指标
    const habitStats: ComputedRef<StatItem[]> = computed(() => {
        // 防御性拦截以防因为没有数据而发生深层属性渲染异常
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
