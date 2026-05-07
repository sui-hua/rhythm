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
import { toDailyPlanStatus } from '@/utils/dailyPlanStatus'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { buildDayExecutionItems } from './useDayExecutionItems'
import { matchesHabitFrequency } from '@/views/habits/utils/habitFrequency'

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

    /**
     * 基于当前 dateStore 计算当天的起止时间
     *
     * @returns {{ startOfDay: Date, endOfDay: Date }}
     */
    const getCurrentDayRange = () => {
        const { year, month, day } = routeDateContext.value

        return {
            startOfDay: new Date(year, month - 1, day, 0, 0, 0),
            endOfDay: new Date(year, month - 1, day, 23, 59, 59)
        }
    }

    /**
     * 切换普通任务完成状态
     *
     * @param {Object} task - day 视图中的统一执行项
     * @returns {Promise<void>}
     */
    const toggleTaskCompletion = async (task) => {
        const updates = { completed: !task.completed }

        // 如果是标记为完成，且已经开始了计时，则记录结束时间
        if (!task.completed) {
            updates.actual_end_time = new Date().toISOString()
        }

        await db.tasks.update(task.id, updates)
    }

    /**
     * 切换习惯当日打卡状态
     *
     * @param {Object} task - day 视图中的统一执行项
     * @returns {Promise<void>}
     */
    const toggleHabitCompletion = async (task) => {
        if (task.completed) {
            const { startOfDay, endOfDay } = getCurrentDayRange()
            const logs = await db.habits.listLogsByDate(startOfDay, endOfDay)
            const log = logs.find((item) => item.habit_id === task.id)

            if (log) {
                await db.habits.deleteLog(log.id)
            }

            return
        }

        const { startOfDay } = getCurrentDayRange()
        await db.habits.log(task.id, '', startOfDay.toISOString())
    }

    /**
     * 切换日计划完成状态
     *
     * @param {Object} task - day 视图中的统一执行项
     * @returns {Promise<void>}
     */
    const toggleDailyPlanCompletion = async (task) => {
        const newStatus = toDailyPlanStatus(!task.completed)
        await db.dailyPlans.update(task.id, { status: newStatus })
    }

    /**
     * 当前选中的月份信息
     * 
     * @type {import('vue').ComputedRef<{name: string, full: string, index: number}>}
     */
    const selectedMonth = computed(() => {
        const monthNum = routeDateContext.value.month
        return {
            name: getMonthName(monthNum, 'zh'),
            full: getMonthName(monthNum, 'full'),
            index: monthNum - 1
        }
    })

    /**
     * 当前选中的天
     * 
     * @type {import('vue').ComputedRef<number>}
     */
    const selectedDay = computed(() => {
        return routeDateContext.value.day
    })

    /**
     * 获取日视图所需的任务数据（Task、DailyPlan、Habit）
     * 
     * @description 从数据库并行拉取当日任务、日程、习惯及打卡记录，
     *             并处理任务自动恢复逻辑（若存在正在运行的任务，
     *             且当前无活跃番茄钟，则自动恢复计时状态）
     * @param {Object} options - 配置选项
     * @param {boolean} [options.showLoading=true] - 是否显示加载状态
     * @returns {Promise<void>}
     */
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
                db.dailyPlans.listForDayView(startOfDay),
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

    /**
     * 整合成完整的打卡日程时间线（使用统一执行项模型）
     * 
     * @description 将 Task、DailyPlan、Habit 三种数据源统一转换为
     *             带有时间线位置、时长、完成状态等属性的执行项列表
     * @returns {Array} 统一执行项数组
     */
    const dailySchedule = computed(() => {
        return buildDayExecutionItems({
            targetDate: new Date(
                routeDateContext.value.year,
                routeDateContext.value.month - 1,
                routeDateContext.value.day
            ),
            tasks: tasks.value,
            dailyPlans: dailyPlans.value,
            habits: habits.value,
            habitLogs: habitLogs.value
        })
    })

    /**
     * 已完成日程项的数量
     * 
     * @type {import('vue').ComputedRef<number>}
     */
    const completedCount = computed(() => dailySchedule.value.filter(t => t.completed).length)

    /**
     * 设置加载状态
     * @param {boolean} value - 加载状态值
     */
    const setLoading = (value) => {
        isLoading.value = value
    }

    /**
     * 将指定日期前一天的未完成任务顺延到目标日期
     * 
     * @description 筛选出 sourceDate（前一天）中未完成且在近 7 天内创建的任务，
     *             将其 start_time 和 end_time 都向后推移一天
     * @param {Date} targetDate - 目标日期（通常是今天）
     * @returns {Promise<void>}
     */
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

    /**
     * 切换日程项的完成状态
     * 
     * @description 根据类型执行不同操作：
     *             - task: 更新 completed 状态，完成时记录 actual_end_time
     *             - habit: 创建或删除打卡日志
     *             - daily_plan: 更新 status 状态
     *             完成时播放成功音效
     * @param {Object} task - 日程执行项
     * @param {string} task.type - 类型：'task' | 'habit' | 'daily_plan'
     * @param {number} task.id - 原始数据 ID
     * @param {boolean} task.completed - 当前完成状态
     * @returns {Promise<void>}
     */
    const handleToggleComplete = async (task) => {
        if (!task) return
        try {
            if (task.type === 'task') {
                await toggleTaskCompletion(task)
            }
            if (task.type === 'habit') {
                await toggleHabitCompletion(task)
            } 
            if (task.type === 'daily_plan') {
                await toggleDailyPlanCompletion(task)
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

    /**
     * 开始任务计时
     * 
     * @description 更新任务的 actual_start_time，启动番茄钟计时器，
     *             并自动弹出计时模态框
     * @param {Object} task - 任务执行项（仅 type='task' 有效）
     * @param {string} task.type - 任务类型
     * @param {number} task.id - 任务 ID
     * @returns {Promise<void>}
     */
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
