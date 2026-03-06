import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'

/**
 * Day 视图核心数据管理层 (Composable)
 * 负责解析时间参数、获取并组装统一日程列表以及统计数据
 */
export function useDayData() {
    const route = useRoute()
    const dateStore = useDateStore()

    // 当前选中的月份
    const selectedMonth = computed(() => {
        const now = new Date()
        const monthNum = route.params.monthIndex ? parseInt(route.params.monthIndex) : (now.getMonth() + 1)
        return {
            name: getMonthName(monthNum, 'zh'),
            full: getMonthName(monthNum, 'full'),
            index: monthNum - 1
        }
    })

    // 当前选中的天
    const selectedDay = computed(() => {
        const now = new Date()
        return route.params.day ? parseInt(route.params.day) : now.getDate()
    })

    // 原始数据存储
    const tasks = ref([])
    const dailyPlans = ref([])
    const habits = ref([])
    const habitLogs = ref([])

    // 获取数据
    const fetchTasks = async () => {
        try {
            const year = dateStore.currentDate.getFullYear()
            const month = selectedMonth.value.index
            const day = selectedDay.value

            const startOfDay = new Date(year, month, day, 0, 0, 0)
            const endOfDay = new Date(year, month, day, 23, 59, 59)

            tasks.value = await db.tasks.list(startOfDay, endOfDay)
            dailyPlans.value = await db.dailyPlans.listByDate(startOfDay)

            const allHabits = await db.habits.list()
            habits.value = allHabits.filter(h => !h.is_archived && h.task_time)

            habitLogs.value = habits.value.flatMap(h => h.habit_logs || []).filter(log => {
                const logDate = new Date(log.completed_at)
                return logDate >= startOfDay && logDate <= endOfDay
            })
        } catch (error) {
            console.error('获取日数据失败:', error)
        }
    }

    // 将所有模块整合成完整的打卡日程时间线
    const dailySchedule = computed(() => {
        const schedule = []

        // 1. 处理任务
        tasks.value.forEach(task => {
            const startDate = new Date(task.start_time)
            const endDate = new Date(task.end_time)
            const startHourVal = startDate.getHours() + startDate.getMinutes() / 60
            const endHourVal = endDate.getHours() + endDate.getMinutes() / 60
            const durationHours = endHourVal - startHourVal
            const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

            schedule.push({
                id: task.id,
                type: 'task',
                original: task,
                startHour: startHourVal,
                durationHours,
                rawDuration: durationHours,
                time: startTimeStr,
                duration: durationHours.toFixed(1) + '小时',
                category: '个人任务',
                title: task.title,
                description: task.description,
                completed: task.completed
            })
        })

        // 2. 处理日计划
        dailyPlans.value.forEach(plan => {
            let startHourVal, startTimeStr, durationHours, durationStr
            if (plan.task_time) {
                const [hours, minutes] = plan.task_time.split(':').map(Number)
                startHourVal = hours + minutes / 60
                startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                durationHours = 0.5
                durationStr = '30分钟'
            } else {
                startHourVal = undefined
                startTimeStr = '未安排'
                durationHours = 0
                durationStr = '-'
            }

            schedule.push({
                id: plan.id,
                type: 'daily_plan',
                original: plan,
                startHour: startHourVal,
                durationHours,
                rawDuration: durationHours,
                time: startTimeStr,
                duration: durationStr,
                category: '今日计划',
                title: plan.title,
                description: plan.description || '',
                completed: plan.status === 'completed'
            })
        })

        // 3. 处理习惯
        habits.value.forEach(habit => {
            let startHourVal, startTimeStr, durationHours, durationStr
            if (habit.task_time) {
                const [hours, minutes] = habit.task_time.split(':').map(Number)
                startHourVal = hours + minutes / 60
                startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

                const durationMins = habit.duration || 30
                durationHours = durationMins / 60
                durationStr = durationHours < 1 ? `${durationMins}分钟` : `${durationHours.toFixed(1)}小时`
            } else {
                startHourVal = undefined
                startTimeStr = '未安排'
                durationHours = 0
                durationStr = '-'
            }

            const isCompleted = habitLogs.value.some(log => log.habit_id === habit.id)

            schedule.push({
                id: habit.id,
                type: 'habit',
                original: habit,
                startHour: startHourVal,
                durationHours,
                rawDuration: durationHours,
                time: startTimeStr,
                duration: durationStr,
                category: '日常习惯',
                title: habit.title,
                description: habit.target_value ? `目标: ${habit.target_value}` : '',
                completed: isCompleted
            })
        })

        // 排序
        return schedule.sort((a, b) => {
            if (a.startHour !== undefined && b.startHour !== undefined) return a.startHour - b.startHour
            if (a.startHour !== undefined) return -1
            if (b.startHour !== undefined) return 1
            return 0
        })
    })

    const completedCount = computed(() => dailySchedule.value.filter(t => t.completed).length)

    return {
        selectedMonth,
        selectedDay,
        dailySchedule,
        completedCount,
        fetchTasks
    }
}
