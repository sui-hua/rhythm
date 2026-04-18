/**
 * ============================================
 * 习惯统计指标计算 (views/habits/composables/useHabitStats.js)
 * ============================================
 *
 * 【模块职责】
 * - 计算今日所有习惯的总完成率
 * - 计算单个习惯的详细统计数据
 *
 * 【统计指标 - habitStats】
 * - 本月打卡天数
 * - 年度总计天数
 * - 周期完成率
 * - 当前连击天数
 *
 * 【今日完成率计算 - todayCompletionRate】
 * - 遍历所有习惯
 * - 检查每项在系统"今天"是否有打卡记录
 * - 返回 0-100 的百分比
 */
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
        // 直接抓取系统真实今天，不受日历或其它视图干扰
        const todayDate = new Date()
        const currentYear = todayDate.getFullYear()
        const currentMonth = todayDate.getMonth()
        const currentDay = todayDate.getDate()

        // 遍历习惯列表，检查它们每项在真实系统时间“今日”是否存在打卡记录
        const completedTodayCount = habits.value.filter((h) => {
            // 使用不受页面翻页控制的全量 logs 过滤
            return h.logs.some((log) => {
                const logDate = new Date(log.completed_at)
                return logDate.getFullYear() === currentYear &&
                    logDate.getMonth() === currentMonth &&
                    logDate.getDate() === currentDay
            })
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
