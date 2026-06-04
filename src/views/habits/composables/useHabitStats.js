import { computed } from 'vue'
import { useDateStore } from '@/stores/dateStore'

export function useHabitStats(habits, selectedHabit) {
    const dateStore = useDateStore()

    const todayCompletionRate = computed(() => {
        // 若尚未加载习惯项目，率值为 0
        if (!habits.value || habits.value.length === 0) return 0
        // 直接抓取系统真实今天，不受日历或其它视图干扰
        const todayDate = new Date()
        const currentYear = todayDate.getFullYear()
        const currentMonth = todayDate.getMonth()
        const currentDay = todayDate.getDate()

        // 遍历习惯列表，检查它们每项在真实系统时间”今日”是否存在打卡记录
        const completedTodayCount = habits.value.filter((h) => {
            // 防御性检查：logs 可能尚未加载
            if (!h.logs || !Array.isArray(h.logs)) return false
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
