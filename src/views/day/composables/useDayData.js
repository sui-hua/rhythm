/**
 * ============================================
 * Day 视图核心数据层 (views/day/composables/useDayData.js)
 * ============================================
 *
 * 【模块职责】
 * - 解析日视图路由参数
 * - 获取并聚合 Task、DailyPlan、Habit 三种数据源
 * - 提供统一的时间线日程列表
 * - 处理任务完成状态切换
 * - 管理番茄钟计时
 *
 * 【数据结构 - dailySchedule】
 * - type: 'task' | 'daily_plan' | 'habit'
 * - original: 原始数据对象
 * - startHour: 开始小时（浮点数）
 * - time: 格式化时间字符串
 * - duration/durationHours: 时长
 * - completed: 是否完成
 *
 * 【单例数据】
 * - tasks, dailyPlans, habits, habitLogs 提升到模块顶层
 * - 实现跨组件共享，减少重复请求
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { playSuccessSound } from '@/utils/audio'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { formatDuration } from '@/utils/formatDuration'
import { isDailyPlanCompleted, toDailyPlanStatus } from '@/utils/dailyPlanStatus'
import { getRouteDateContext } from '@/views/day/utils/routeDateContext'

// 提升原始数据存储到模块顶层，实现跨组件共享数据单例
const tasks = ref([])
const dailyPlans = ref([])
const habits = ref([])
const habitLogs = ref([])
const isLoading = ref(false)

/**
 * Day 视图核心数据管理层 (Composable)
 * 负责解析时间参数、获取并组装统一日程列表以及统计数据
 */
export function useDayData() {
    const route = useRoute()
    const dateStore = useDateStore()
    const routeDateContext = computed(() => getRouteDateContext(route.params, dateStore.currentDate))

    // 当前选中的月份
    const selectedMonth = computed(() => {
        const monthNum = routeDateContext.value.month
        return {
            name: getMonthName(monthNum, 'zh'),
            full: getMonthName(monthNum, 'full'),
            index: monthNum - 1
        }
    })

    // 当前选中的天
    const selectedDay = computed(() => {
        return routeDateContext.value.day
    })

    // 获取数据
    const fetchTasks = async (options = {}) => {
        const { showLoading = true } = options
        try {
            if (showLoading) isLoading.value = true
            const { year, month, day } = routeDateContext.value
            const monthZeroBased = month - 1

            const startOfDay = new Date(year, monthZeroBased, day, 0, 0, 0)
            const endOfDay = new Date(year, monthZeroBased, day, 23, 59, 59)

            const [fetchedTasks, fetchedPlans, allHabits, dayHabitLogs] = await Promise.all([
                db.tasks.list(startOfDay, endOfDay),
                db.dailyPlans.listByDate(startOfDay),
                db.habits.listLite(),
                db.habits.listLogsByDate(startOfDay, endOfDay)
            ])

            tasks.value = fetchedTasks || []
        
            // 自动恢复：如果存在正在运行中的任务，且当前没有活跃记录，则自动弹出模态框
            const runningTask = tasks.value.find(t => t.actual_start_time && !t.actual_end_time && !t.completed)
            if (runningTask) {
                const pomodoroStore = usePomodoroStore()
                if (!pomodoroStore.activeTask) {
                    pomodoroStore.setActiveTask({
                        ...runningTask,
                        type: 'task' // 确保类型正确
                    })
                }
            }
            dailyPlans.value = fetchedPlans
            habits.value = allHabits.filter(h => !h.is_archived && h.task_time)
            habitLogs.value = dayHabitLogs
        } catch (error) {
            console.error('获取日数据失败:', error)
        } finally {
            if (showLoading) isLoading.value = false
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
                duration: formatDuration(durationHours),
                category: '个人任务',
                title: task.title,
                description: task.description,
                completed: task.completed,
                actual_start_time: task.actual_start_time,
                actual_end_time: task.actual_end_time
            })
        })

        // 2. 处理日计划
        dailyPlans.value.forEach(plan => {
            let startHourVal, startTimeStr, durationHours, durationStr
            
            // 计算继承的时间和时长
            const inheritedTime = plan.task_time || plan.monthly_plans?.task_time || plan.monthly_plans?.plans?.task_time
            const inheritedDuration = plan.duration || plan.monthly_plans?.duration || plan.monthly_plans?.plans?.duration || 30

            if (inheritedTime) {
                const [hours, minutes] = inheritedTime.split(':').map(Number)
                startHourVal = hours + minutes / 60
                startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                durationHours = inheritedDuration / 60
                durationStr = formatDuration(durationHours)
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
                completed: isDailyPlanCompleted(plan.status)
            })
        })

        // 3. 处理习惯
        const habitLogIds = new Set(habitLogs.value.map(log => log.habit_id))

        habits.value.forEach(habit => {
            let startHourVal, startTimeStr, durationHours, durationStr
            if (habit.task_time) {
                const [hours, minutes] = habit.task_time.split(':').map(Number)
                startHourVal = hours + minutes / 60
                startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

                const durationMins = habit.duration || 30
                durationHours = durationMins / 60
                durationStr = formatDuration(durationHours)
            } else {
                startHourVal = undefined
                startTimeStr = '未安排'
                durationHours = 0
                durationStr = '-'
            }

            const isCompleted = habitLogIds.has(habit.id)

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

    const setLoading = (value) => {
        isLoading.value = value
    }

    const carryOverUncompletedTasksTo = async (targetDate) => {
        if (!targetDate) return

        const sourceDate = new Date(targetDate)
        sourceDate.setDate(sourceDate.getDate() - 1)

        const startOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 0, 0, 0)
        const endOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 23, 59, 59)
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000
        const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)

        try {
            const sourceTasks = await db.tasks.list(startOfSource, endOfSource)
            const uncompleted = (sourceTasks || []).filter(t => !t.completed).filter(t => {
                const createdAt = t.created_at ? new Date(t.created_at) : null
                if (!createdAt || isNaN(createdAt.getTime())) return false
                // Only carry over tasks created within the last 7 days.
                return (targetStart.getTime() - createdAt.getTime()) < oneWeekMs
            })

            if (!uncompleted.length) return

            await Promise.all(
                uncompleted.map(task => {
                    const start = new Date(task.start_time)
                    const end = new Date(task.end_time)
                    const newStart = new Date(start)
                    const newEnd = new Date(end)
                    newStart.setDate(newStart.getDate() + 1)
                    newEnd.setDate(newEnd.getDate() + 1)
                    return db.tasks.update(task.id, {
                        start_time: newStart.toISOString(),
                        end_time: newEnd.toISOString()
                    })
                })
            )
        } catch (e) {
            console.error('顺延未完成任务失败:', e)
        }
    }

    // 切换各类日程项的完成状态
    const handleToggleComplete = async (task) => {
        if (!task) return
        try {
            if (task.type === 'task') {
                const updates = { completed: !task.completed }
                // 如果是标记为完成，且已经开始了计时，则记录结束时间
                if (!task.completed) {
                    updates.actual_end_time = new Date().toISOString()
                }
                await db.tasks.update(task.id, updates)
            } else if (task.type === 'habit') {
                if (task.completed) {
                    const year = dateStore.currentDate.getFullYear()
                    const month = dateStore.currentDate.getMonth()
                    const day = dateStore.currentDate.getDate()
                    const startOfDay = new Date(year, month, day, 0, 0, 0)
                    const endOfDay = new Date(year, month, day, 23, 59, 59)
                    const logs = await db.habits.listLogsByDate(startOfDay, endOfDay)
                    const log = logs.find(l => l.habit_id === task.id)
                    if (log) await db.habits.deleteLog(log.id)
                } else {
                    await db.habits.log(task.id, '')
                }
            } else if (task.type === 'daily_plan') {
                const newStatus = toDailyPlanStatus(!task.completed)
                await db.dailyPlans.update(task.id, { status: newStatus })
            }

            // 如果操作是将状态改为已完成，则播放成功音效
            if (!task.completed) {
                playSuccessSound()
            }

            await fetchTasks({ showLoading: false })
        } catch (e) {
            console.error('切换完成状态失败', e)
        }
    }

    // 开始任务计时
    const handleStartTask = async (task) => {
        if (!task || task.type !== 'task') return
        const pomodoroStore = usePomodoroStore()
        try {
            const startTime = new Date().toISOString()
            await db.tasks.update(task.id, { 
                actual_start_time: startTime,
                actual_end_time: null // 重置结束时间以防重复开始
            })
            await fetchTasks({ showLoading: false })
            
            // 弹出计时模态框
            pomodoroStore.setActiveTask({ ...task, actual_start_time: startTime })
        } catch (e) {
            console.error('开始计时失败', e)
        }
    }

    return {
        isLoading,
        setLoading,
        selectedMonth,
        selectedDay,
        dailySchedule,
        completedCount,
        fetchTasks,
        carryOverUncompletedTasksTo,
        handleToggleComplete,
        handleStartTask
    }
}
