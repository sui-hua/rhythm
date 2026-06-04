import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { playSuccessSound } from '@/utils/audio'
import { toGoalDayStatus } from '@/utils/goalDayStatus'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { buildDayExecutionItems } from '@/views/day/composables/useDayExecutionItems'
import { matchesHabitFrequency } from '@/views/habits/utils/habitFrequency'
import type { Task } from '@/services/db/task'
import type { GoalDay } from '@/services/db/goalDays'
import type { Habit, HabitLog } from '@/services/db/habit'
import type { DailyScheduleItem, ActiveTask } from '@/types/models'

/** fetchTasks 的选项 */
interface FetchTasksOptions {
  showLoading?: boolean
}

/** 日期上下文（年月日分量） */
interface DateContext {
  year: number
  month: number
  day: number
}

export const useDayStore = defineStore('day', () => {
  // 任务列表
  const tasks = ref<Task[]>([])
  // 当日目标计划列表
  const goalDays = ref<GoalDay[]>([])
  // 当日匹配的习惯列表
  const habits = ref<Habit[]>([])
  // 当日习惯日志列表
  const habitLogs = ref<HabitLog[]>([])
  // 全局加载状态
  const isLoading = ref<boolean>(false)

  const dateStore = useDateStore()

  // 从 dateStore.currentDate 派生年月日，不再依赖 useRoute()
  // 路由参数由 useDayNavigation 同步到 dateStore，store 只读 dateStore
  const routeDateContext = computed<DateContext>(() => {
    const d = dateStore.currentDate
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    }
  })

  // 获取当日的起止时间范围
  const getCurrentDayRange = (): { startOfDay: Date; endOfDay: Date } => {
    const { year, month, day } = routeDateContext.value
    return {
      startOfDay: new Date(year, month - 1, day, 0, 0, 0),
      endOfDay: new Date(year, month - 1, day, 23, 59, 59)
    }
  }

  // 切换任务完成状态（通过 status 字段控制）
  const toggleTaskCompletion = async (task: DailyScheduleItem): Promise<void> => {
    const newStatus = task.completed ? 'pending' : 'completed'
    const updates: Record<string, unknown> = { status: newStatus }
    if (!task.completed) {
      updates.actual_end_time = new Date().toISOString()
    }
    await db.task.update(task.id, updates as any)
  }

  // 切换习惯完成状态（删除或添加日志）
  const toggleHabitCompletion = async (task: DailyScheduleItem): Promise<void> => {
    if (task.completed) {
      const { startOfDay, endOfDay } = getCurrentDayRange()
      const logs = await db.habit.listLogsByDate(startOfDay, endOfDay)
      const log = logs.find((item: HabitLog) => String(item.habit_id) === String(task.id))
      if (log) {
        await db.habit.deleteLog(log.id)
      }
      return
    }
    const { startOfDay } = getCurrentDayRange()
    await db.habit.log(task.id, '', startOfDay)
  }

  // 切换日计划完成状态
  const toggleDailyPlanCompletion = async (task: DailyScheduleItem): Promise<void> => {
    const newStatus = toGoalDayStatus(!task.completed)
    await db.goalDays.update(task.id, { status: newStatus } as any)
  }

  // 当前选中月份信息
  const selectedMonth = computed(() => {
    const monthNum = routeDateContext.value.month
    return {
      name: getMonthName(monthNum, 'zh'),
      full: getMonthName(monthNum, 'full'),
      index: monthNum - 1
    }
  })

  // 当前选中日
  const selectedDay = computed<number>(() => routeDateContext.value.day)

  // 单条任务同步：只拉取指定任务的最新状态，避免全量刷新
  const fetchTaskUpdate = async (taskId: string): Promise<void> => {
    try {
      // task 服务没有 getById，使用 query 替代
      const results = await db.task.list()
      const updated = results.find(t => String(t.id) === String(taskId))
      if (!updated) return
      const index = tasks.value.findIndex(t => String(t.id) === String(taskId))
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updated }
      }
    } catch (e) {
      console.error('同步单条任务失败:', e)
    }
  }

  // 拉取当日所有数据（任务、计划、习惯、习惯日志）
  const fetchTasks = async (options: FetchTasksOptions = {}): Promise<void> => {
    const { showLoading = true } = options
    try {
      if (showLoading) isLoading.value = true
      const { year, month, day } = routeDateContext.value
      const monthZeroBased = month - 1

      const startOfDay = new Date(year, monthZeroBased, day,  0, 0, 0)
      const endOfDay = new Date(year, monthZeroBased, day, 23, 59, 59)

      const [fetchedTasks, fetchedPlans, allHabits, dayHabitLogs] = await Promise.all([
        db.task.list(startOfDay, endOfDay),
        db.goalDays.listForDayView(startOfDay),
        db.habit.list(),
        db.habit.listLogsByDate(startOfDay, endOfDay)
      ])

      tasks.value = fetchedTasks || []

      // 检查是否有正在运行的任务，同步到番茄钟
      const runningTask = tasks.value.find(t =>
        t.start_time && !t.status?.includes('completed') && t.status !== 'completed'
      )
      if (runningTask) {
        const pomodoroStore = usePomodoroStore()
        if (!pomodoroStore.activeTask) {
          pomodoroStore.setActiveTask({
            ...runningTask,
            type: 'task'
          } as unknown as ActiveTask)
        }
      }
      goalDays.value = fetchedPlans
      habits.value = allHabits.filter((habit: Habit) => {
        return !habit.is_archived
          && habit.frequency
          && matchesHabitFrequency(habit.frequency, startOfDay)
      })
      habitLogs.value = dayHabitLogs
    } catch (error) {
      console.error('获取日数据失败:', error)
    } finally {
      if (showLoading) isLoading.value = false
    }
  }

  // 当日日程安排（由 buildDayExecutionItems 聚合生成）
  // buildDayExecutionItems 内部有自己的类型定义，这里使用 any 绕过类型差异
  const dailySchedule = computed<DailyScheduleItem[]>(() => {
    return buildDayExecutionItems({
      targetDate: new Date(
        routeDateContext.value.year,
        routeDateContext.value.month - 1,
        routeDateContext.value.day
      ),
      tasks: tasks.value as any,
      goalDays: goalDays.value as any,
      habits: habits.value as any,
      habitLogs: habitLogs.value as any
    }) as unknown as DailyScheduleItem[]
  })

  // 已完成数量
  const completedCount = computed<number>(() => dailySchedule.value.filter(t => t.completed).length)

  // 手动设置加载状态
  const setLoading = (value: boolean): void => {
    isLoading.value = value
  }

  // 顺延未完成任务到目标日期
  const carryOverUncompletedTasksTo = async (targetDate: Date): Promise<void> => {
    if (!targetDate) return

    const sourceDate = new Date(targetDate)
    sourceDate.setDate(sourceDate.getDate() - 1)

    const startOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 0, 0, 0)
    const endOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 23, 59, 59)
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)

    try {
      const sourceTasks = await db.task.list(startOfSource, endOfSource)
      const uncompleted = (sourceTasks || []).filter((t: Task) => t.status !== 'completed').filter((t: Task) => {
        const createdAt = t.created_at ? new Date(t.created_at) : null
        if (!createdAt || isNaN(createdAt.getTime())) return false
        return (targetStart.getTime() - createdAt.getTime()) < oneWeekMs
      })

      if (!uncompleted.length) return

      await Promise.all(
        uncompleted.map((task: Task) => {
          const start = new Date(task.start_time || '')
          const end = new Date(task.end_time || '')
          const newStart = new Date(start)
          const newEnd = new Date(end)
          newStart.setDate(newStart.getDate() + 1)
          newEnd.setDate(newEnd.getDate() + 1)
          return db.task.update(task.id, {
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString()
          } as any)
        })
      )
    } catch (e) {
      console.error('顺延未完成任务失败:', e)
    }
  }

  // 切换完成状态（乐观更新，支持 task / habit / goal_day）
  const handleToggleComplete = async (task: DailyScheduleItem): Promise<void> => {
    if (!task) return

    // 乐观更新：先在本地修改状态
    const previousState = task.completed
    task.completed = !task.completed

    try {
      if (task.type === 'task') {
        await toggleTaskCompletion(task)
        await fetchTaskUpdate(task.id)
      }
      if (task.type === 'habit') {
        await toggleHabitCompletion(task)
      }
      if (task.type === 'goal_day') {
        await toggleDailyPlanCompletion(task)
      }

      if (!previousState) {
        playSuccessSound()
      }
    } catch (e) {
      // 回滚：恢复原始状态
      task.completed = previousState
      console.error('切换完成状态失败', e)
    }
  }

  // 开始任务计时（乐观更新）
  const handleStartTask = async (task: DailyScheduleItem): Promise<void> => {
    if (!task || task.type !== 'task') return
    const pomodoroStore = usePomodoroStore()
    const startTime = new Date().toISOString()

    // 乐观更新
    task.actual_start_time = startTime
    task.actual_end_time = null

    try {
      await db.task.update(task.id, {
        start_time: startTime,
        status: 'pending'
      } as any)
      await fetchTaskUpdate(task.id)
      pomodoroStore.setActiveTask({
        ...task,
        type: 'task',
        actual_start_time: startTime
      } as unknown as ActiveTask)
    } catch (e) {
      // 回滚
      task.actual_start_time = null
      console.error('开始计时失败', e)
    }
  }

  // 更新任务时间（乐观更新）
  const updateTaskTime = async (task: DailyScheduleItem, newStartHour: number, newEndHour: number): Promise<void> => {
    if (!task || task.type !== 'task') return
    const { year, month, day } = routeDateContext.value
    const baseDate = new Date(year, month - 1, day)

    const startTime = new Date(baseDate)
    startTime.setHours(Math.floor(newStartHour), Math.round((newStartHour % 1) * 60))

    const endTime = new Date(baseDate)
    endTime.setHours(Math.floor(newEndHour), Math.round((newEndHour % 1) * 60))

    // 乐观更新
    const previousStart = task.start_time
    const previousEnd = task.end_time
    task.start_time = startTime.toISOString()
    task.end_time = endTime.toISOString()

    try {
      await db.task.update(task.id, {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      } as any)
      await fetchTaskUpdate(task.id)
    } catch (e) {
      // 回滚
      task.start_time = previousStart
      task.end_time = previousEnd
      console.error('更新任务时间失败:', e)
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
    fetchTaskUpdate,
    carryOverUncompletedTasksTo,
    handleToggleComplete,
    handleStartTask,
    updateTaskTime
  }
})
