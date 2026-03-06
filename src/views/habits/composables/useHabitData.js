import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

/**
 * 习惯数据管理核心逻辑 (Composable)
 * 负责获取习惯列表数据、维护当前选中习惯、以及管理日历视图的年份和月份状态。
 */
export function useHabitData() {
    const dateStore = useDateStore()

    // 存储所有的习惯列表数据（包含已归档）
    const allHabits = ref([])

    // 向外暴露的活跃习惯（过滤掉已归档）
    const habits = computed(() => allHabits.value.filter(h => !h.is_archived))
    // 向外暴露的已归档习惯
    const archivedHabits = computed(() => allHabits.value.filter(h => h.is_archived))

    // 存储当前用户在左侧列表选中的某项具体习惯对象
    const selectedHabit = ref(null)

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
        fetchHabits()
    }

    /**
     * 简单的连击天数计算逻辑 (当前为简易占位符版本实现)
     * @param {Array} logs - 该习惯的所有打卡记录
     * @returns {number} 连击天数
     */
    const calculateStreak = (logs) => {
        return logs.length > 0 ? logs.length : 0
    }

    /**
     * 核心异步逻辑：从数据库层拉取最新习惯数据并进行组合加工
     */
    const fetchHabits = async () => {
        try {
            const rawHabits = await db.habits.list()
            allHabits.value = rawHabits.map((h) => {
                const logs = h.habit_logs || []

                // 基于当前展示月(viewYear, viewMonth)过滤对应时间内的打卡记录打卡数据
                const monthlyLogs = logs.filter((log) => {
                    const d = new Date(log.completed_at)
                    return d.getFullYear() === viewYear.value && d.getMonth() === viewMonth.value
                })

                // 将本月日志数据转化提取出具体的打卡「天数组」，用于直观给日历组件标注高亮
                const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

                return {
                    ...h,
                    completedDays, // 视图本月专属数据属性：已打卡具体天的集合 (如 [12, 13, 14])
                    logs,          // 完整存储包含该习惯以往所有时期的历史打卡记录
                    monthlyLogs,   // 视图本月专属数据属性：过滤好的打卡记录详细数据
                    total: logs.length,                               // （统计使用）总累计打卡次数
                    completionRate: Math.round((logs.length / 30) * 100), // （统计使用）通过30基数计算的预估完成百分率
                    streak: calculateStreak(logs)                     // （统计使用）连击天数
                }
            })

            // 拉取刷新数据时，保证视图之前的“选中状态”得以继续维持不至于在列表重新渲染时丢失聚焦
            if (selectedHabit.value) {
                const updated = allHabits.value.find((h) => h.id === selectedHabit.value.id)
                if (updated) selectedHabit.value = updated
                else selectedHabit.value = null
            } else if (habits.value.length > 0) {
                // 或者首次加载默认先展示未归档的第一项内容
                selectedHabit.value = habits.value[0]
            } else if (archivedHabits.value.length > 0) {
                selectedHabit.value = archivedHabits.value[0]
            }
        } catch (e) {
            console.error('Fetch habits failed', e)
        }
    }

    return {
        habits,
        archivedHabits,
        selectedHabit,
        viewYear,
        viewMonth,
        handleMonthChange,
        fetchHabits
    }
}
