import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { playSuccessSound } from '@/utils/audio'
import { toGoalDayStatus } from '@/utils/goalDayStatus'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { buildDayExecutionItems } from './useDayExecutionItems'
import { matchesHabitFrequency } from '@/views/habits/utils/habitFrequency'

// Module-level refs for cross-component singleton data sharing
const tasks = ref([])
const goalDays = ref([])
const habits = ref([])
const habitLogs = ref([])
const isLoading = ref(false)

export function useDayData() {
    const route = useRoute()
    const dateStore = useDateStore()
    const routeDateContext = computed(() => getRouteDateContext(route.params, dateStore.currentDate))

    const getCurrentDayRange = () => {
        const { year, month, day } = routeDateContext.value
        return {
            startOfDay: new Date(year, month - 1, day, 0, 0, 0),
            endOfDay: new Date(year, month - 1, day, 23, 59, 59)
        }
    }

    const toggleTaskCompletion = async (task) => {
        const updates = { completed: !task.completed }
        if (!task.completed) {
            updates.actual_end_time = new Date().toISOString()
        }
        await db.task.update(task.id, updates)
    }

    const toggleHabitCompletion = async (task) => {
        if (task.completed) {
            const { startOfDay, endOfDay } = getCurrentDayRange()
            const logs = await db.habit.listLogsByDate(startOfDay, endOfDay)
            const log = logs.find((item) => item.habit_id === task.id)
            if (log) {
                await db.habit.deleteLog(log.id)
            }
            return
        }
        const { startOfDay } = getCurrentDayRange()
        await db.habit.log(task.id, '', startOfDay.toISOString())
    }

    const toggleDailyPlanCompletion = async (task) => {
        const newStatus = toGoalDayStatus(!task.completed)
        await db.goalDays.update(task.id, { status: newStatus })
    }

    const selectedMonth = computed(() => {
        const monthNum = routeDateContext.value.month
        return {
            name: getMonthName(monthNum, 'zh'),
            full: getMonthName(monthNum, 'full'),
            index: monthNum - 1
        }
    })

    const selectedDay = computed(() => routeDateContext.value.day)

    const fetchTasks = async (options = {}) => {
        const { showLoading = true } = options
        try {
            if (showLoading) isLoading.value = true
            const { year, month, day } = routeDateContext.value
            const monthZeroBased = month - 1

            const startOfDay = new Date(year, monthZeroBased, day, 0, 0, 0)
            const endOfDay = new Date(year, monthZeroBased, day, 23, 59, 59)

            const [fetchedTasks, fetchedPlans, allHabits, dayHabitLogs] = await Promise.all([
                db.task.list(startOfDay, endOfDay),
                db.goalDays.listForDayView(startOfDay),
                db.habit.list(),
                db.habit.listLogsByDate(startOfDay, endOfDay)
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
            goalDays.value = fetchedPlans
            habits.value = allHabits.filter((habit) => {
                return !habit.is_archived
                    && habit.task_time
                    && matchesHabitFrequency(habit.frequency, startOfDay)
            })
            habitLogs.value = dayHabitLogs
        } catch (error) {
            console.error('获取日数据失败:', error)
        } finally {
            if (showLoading) isLoading.value = false
        }
    }

    const dailySchedule = computed(() => {
        return buildDayExecutionItems({
            targetDate: new Date(
                routeDateContext.value.year,
                routeDateContext.value.month - 1,
                routeDateContext.value.day
            ),
            tasks: tasks.value,
            goalDays: goalDays.value,
            habits: habits.value,
            habitLogs: habitLogs.value
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
            const sourceTasks = await db.task.list(startOfSource, endOfSource)
            const uncompleted = (sourceTasks || []).filter(t => !t.completed).filter(t => {
                const createdAt = t.created_at ? new Date(t.created_at) : null
                if (!createdAt || isNaN(createdAt.getTime())) return false
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
                    return db.task.update(task.id, {
                        start_time: newStart.toISOString(),
                        end_time: newEnd.toISOString()
                    })
                })
            )
        } catch (e) {
            console.error('顺延未完成任务失败:', e)
        }
    }

    const handleToggleComplete = async (task) => {
        if (!task) return
        try {
            if (task.type === 'task') {
                await toggleTaskCompletion(task)
            }
            if (task.type === 'habit') {
                await toggleHabitCompletion(task)
            }
            if (task.type === 'goal_day') {
                await toggleDailyPlanCompletion(task)
            }

            if (!task.completed) {
                playSuccessSound()
            }

            await fetchTasks({ showLoading: false })
        } catch (e) {
            console.error('切换完成状态失败', e)
        }
    }

    const handleStartTask = async (task) => {
        if (!task || task.type !== 'task') return
        const pomodoroStore = usePomodoroStore()
        try {
            const startTime = new Date().toISOString()
            await db.task.update(task.id, {
                actual_start_time: startTime,
                actual_end_time: null
            })
            await fetchTasks({ showLoading: false })
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
