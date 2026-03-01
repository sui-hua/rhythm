import { computed } from 'vue'
import { useDateStore } from '@/stores/dateStore'

/**
 * 习惯统计指标计算层逻辑 (Composable)
 * 接收来自主模块的反应性数据作为基底，由此衍生和计算各类复杂的页面数据。
 * @param {Ref<Array>} habits - 各项习惯的数据源集合
 * @param {Ref<Object>} selectedHabit - 当前在页面正中主动被点选查阅状态下的对象数据
 */
export function useHabitStats(habits, selectedHabit) {
    const dateStore = useDateStore()

    /**
     * 聚合运算今日当前的所有任务的总完成度大盘状况，该计算属性为只读。
     * 以百分比标度 `0-100` 展示当日打卡任务进展状况。
     */
    const todayCompletionRate = computed(() => {
        // 若尚未加载习惯项目，率值为 0
        if (!habits.value || habits.value.length === 0) return 0

        const today = dateStore.currentDate.getDate()

        // 遍历习惯列表，检查它们每项在“今日”是否存在记录被标记为了完成的痕迹
        const completedTodayCount = habits.value.filter((h) => {
            // 遍历月内细分日志来核实今日时间段匹配项
            return h.monthlyLogs.some((log) => new Date(log.completed_at).getDate() === today)
        }).length

        return Math.round((completedTodayCount / habits.value.length) * 100)
    })

    /**
     * 基于单个特定习惯 `selectedHabit` 分解生成的指标卡片（面板）分析数据统计。
     * 每项包含 Label 标签名称，动态运算拿到的 value，及特定的测量量词单位 unit。
     */
    const habitStats = computed(() => {
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
