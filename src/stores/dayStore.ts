// dayStore.ts

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
import type { DailyScheduleItem, ActiveTask, TaskScheduleItem } from '@/types/models'
import type { UpdateTaskPayload } from '@/services/db/task'

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

/**
 * 每日时间轴状态管理
 * 聚合 Task、DailyPlan、Habit 三种数据源，生成统一日程列表
 * 支持乐观更新和任务顺延
 */
export const useDayStore = defineStore('day', () => {
  // ── 状态 ──
  // 当日任务列表
  const tasks = ref<Task[]>([])
  // 当日目标计划列表（来自 goal_days 表）
  const goalDays = ref<GoalDay[]>([])
  // 当日匹配频率条件的习惯列表
  const habits = ref<Habit[]>([])
  // 当日习惯完成日志列表
  const habitLogs = ref<HabitLog[]>([])
  // 全局加载状态，控制页面骨架屏和按钮禁用
  const isLoading = ref<boolean>(false)

  const dateStore = useDateStore()

  // ── 计算属性 ──
  // 从 dateStore.currentDate 派生年月日分量，不再依赖 useRoute()
  // 路由参数由 useDayNavigation 同步到 dateStore，此处只读 dateStore 即可
  const routeDateContext = computed<DateContext>(() => {
    const d = dateStore.currentDate
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    }
  })

  // 获取当日的起止时间范围，用于数据库查询的 startOfDay / endOfDay
  const getCurrentDayRange = (): { startOfDay: Date; endOfDay: Date } => {
    const { year, month, day } = routeDateContext.value
    return {
      startOfDay: new Date(year, month - 1, day, 0, 0, 0),
      endOfDay: new Date(year, month - 1, day, 23, 59, 59)
    }
  }

  // 当前选中月份信息，供顶部导航显示月份名称
  const selectedMonth = computed(() => {
    const monthNum = routeDateContext.value.month
    return {
      name: getMonthName(monthNum, 'zh'),
      full: getMonthName(monthNum, 'full'),
      index: monthNum - 1
    }
  })

  // 当前选中日（1-31）
  const selectedDay = computed<number>(() => routeDateContext.value.day)

  // 当日日程安排，由 buildDayExecutionItems 聚合 Task + DailyPlan + Habit 生成
  const dailySchedule = computed<DailyScheduleItem[]>(() => {
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

  // 已完成数量，用于进度展示
  const completedCount = computed<number>(() => dailySchedule.value.filter(t => t.completed).length)

  // ── 私有方法 ──
  // 切换任务完成状态，通过 status 字段控制（pending ↔ completed）
  const toggleTaskCompletion = async (task: TaskScheduleItem): Promise<void> => {
    const newStatus = task.completed ? 'pending' : 'completed'
    const updates: UpdateTaskPayload = { status: newStatus }
    // 完成时记录实际结束时间，用于统计任务耗时
    if (!task.completed) {
      updates.actual_end_time = new Date().toISOString()
    }
    await db.task.update(task.id, updates)
  }

  // 切换习惯完成状态：已完成则删除日志，未完成则添加日志
  const toggleHabitCompletion = async (task: DailyScheduleItem): Promise<void> => {
    if (task.completed) {
      const { startOfDay, endOfDay } = getCurrentDayRange()
      const logs = await db.habit.listLogsByDate(startOfDay, endOfDay)
      // 通过 habit_id 匹配当日日志，需转字符串避免类型不一致
      const log = logs.find((item: HabitLog) => String(item.habit_id) === String(task.id))
      if (log) {
        await db.habit.deleteLog(log.id)
      }
      return
    }
    const { startOfDay } = getCurrentDayRange()
    await db.habit.log(task.id, '', startOfDay)
  }

  // 切换日计划完成状态，使用 toGoalDayStatus 转换为数据库枚举值
  // task.completed 已在调用前被乐观更新翻转，直接传入即可
  const toggleDailyPlanCompletion = async (task: DailyScheduleItem): Promise<void> => {
    const newStatus = toGoalDayStatus(task.completed)
    await db.goalDays.update(task.id, { status: newStatus })
  }

  // 单条任务同步：通过 ID 精确查询，避免全量拉取的性能开销
  const fetchTaskUpdate = async (taskId: string): Promise<void> => {
    try {
      const updated = await db.task.getById(taskId)
      if (!updated) return
      const index = tasks.value.findIndex(t => String(t.id) === String(taskId))
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updated }
      }
    } catch (e) {
      console.error('同步单条任务失败:', e)
    }
  }

  // ── Actions ──
  // 拉取当日所有数据（任务、计划、习惯、习惯日志），并行请求减少等待时间
  const fetchTasks = async (options: FetchTasksOptions = {}): Promise<void> => {
    const { showLoading = true } = options
    try {
      if (showLoading) isLoading.value = true
      const { year, month, day } = routeDateContext.value
      const monthZeroBased = month - 1

      const startOfDay = new Date(year, monthZeroBased, day, 0, 0, 0)
      const endOfDay = new Date(year, monthZeroBased, day, 23, 59, 59)

      // 四个数据源并行请求，任一失败不影响其他
      const [fetchedTasks, fetchedPlans, allHabits, dayHabitLogs] = await Promise.all([
        db.task.list(startOfDay, endOfDay),
        db.goalDays.listForDayView(startOfDay),
        db.habit.list(),
        db.habit.listLogsByDate(startOfDay, endOfDay)
      ])

      tasks.value = fetchedTasks || []

      // 检查是否有正在运行的任务，自动同步到番茄钟 store
      // 避免用户刷新页面后丢失正在进行的计时状态
      const runningTask = tasks.value.find(t =>
        t.start_time && !t.status?.includes('completed') && t.status !== 'completed'
      )
      if (runningTask) {
        const pomodoroStore = usePomodoroStore()
        if (!pomodoroStore.activeTask) {
          pomodoroStore.setActiveTask({
            id: String(runningTask.id),
            title: runningTask.title,
            type: 'task',
            completed: runningTask.completed ?? false,
            start_time: runningTask.start_time,
            end_time: runningTask.end_time,
            actual_start_time: runningTask.actual_start_time,
            actual_end_time: runningTask.actual_end_time,
            original: runningTask
          })
        }
      }
      goalDays.value = fetchedPlans
      // 过滤已归档和不匹配当日频率的习惯
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

  // 手动设置加载状态，供外部组件在特殊场景下控制
  const setLoading = (value: boolean): void => {
    isLoading.value = value
  }

  // 顺延未完成任务到目标日期，仅顺延一周内创建的任务，避免历史遗留任务堆积
  const carryOverUncompletedTasksTo = async (targetDate: Date): Promise<void> => {
    if (!targetDate) return

    // 源日期为目标日期的前一天
    const sourceDate = new Date(targetDate)
    sourceDate.setDate(sourceDate.getDate() - 1)

    const startOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 0, 0, 0)
    const endOfSource = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate(), 23, 59, 59)
    // 只顺延一周内创建的任务，避免把历史遗留任务拉到新日期
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)

    try {
      const sourceTasks = await db.task.list(startOfSource, endOfSource)
      // 先过滤未完成，再过滤创建时间在一周内
      const uncompleted = (sourceTasks || []).filter((t: Task) => t.status !== 'completed').filter((t: Task) => {
        const createdAt = t.created_at ? new Date(t.created_at) : null
        if (!createdAt || isNaN(createdAt.getTime())) return false
        return (targetStart.getTime() - createdAt.getTime()) < oneWeekMs
      })

      if (!uncompleted.length) return

      // 批量更新：将 start_time 和 end_time 各后移一天
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
          } as UpdateTaskPayload)
        })
      )
    } catch (e) {
      console.error('顺延未完成任务失败:', e)
    }
  }

  // 切换完成状态（乐观更新），根据 task.type 分发到对应的处理函数
  const handleToggleComplete = async (task: DailyScheduleItem): Promise<void> => {
    if (!task) return

    // 乐观更新：先在本地修改状态，提升 UI 响应速度
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

      // 完成时播放音效反馈，取消完成时不播放
      if (!previousState) {
        playSuccessSound()
      }
    } catch (e) {
      // 回滚：恢复原始状态，确保 UI 与数据库一致
      task.completed = previousState
      console.error('切换完成状态失败', e)
    }
  }

  // 开始任务计时（乐观更新），同步更新番茄钟状态
  const handleStartTask = async (task: DailyScheduleItem): Promise<void> => {
    if (!task || task.type !== 'task') return
    const pomodoroStore = usePomodoroStore()
    const startTime = new Date().toISOString()

    // 乐观更新：立即反映在 UI 上
    task.actual_start_time = startTime
    task.actual_end_time = null

    try {
      await db.task.update(task.id, {
        start_time: startTime,
        status: 'pending'
      } as UpdateTaskPayload)
      await fetchTaskUpdate(task.id)
      // 同步到番茄钟，使计时器立即启动
      pomodoroStore.setActiveTask({
        id: task.id,
        title: task.title,
        type: 'task',
        completed: task.completed,
        start_time: task.original.start_time,
        end_time: task.original.end_time,
        actual_start_time: startTime,
        actual_end_time: null,
        original: task.original
      })
    } catch (e) {
      // 回滚：清除乐观更新的值
      task.actual_start_time = null
      console.error('开始计时失败', e)
    }
  }

  // 更新任务时间（乐观更新），支持拖拽时间轴调整时间段
  const updateTaskTime = async (task: DailyScheduleItem, newStartHour: number, newEndHour: number): Promise<void> => {
    if (!task || task.type !== 'task') return
    const { year, month, day } = routeDateContext.value
    const baseDate = new Date(year, month - 1, day)

    // 将小数小时转换为时分，如 9.5 → 9:30
    const startTime = new Date(baseDate)
    startTime.setHours(Math.floor(newStartHour), Math.round((newStartHour % 1) * 60))

    const endTime = new Date(baseDate)
    endTime.setHours(Math.floor(newEndHour), Math.round((newEndHour % 1) * 60))

    // 保存原始值用于回滚
    const previousStart = task.original.start_time
    const previousEnd = task.original.end_time

    try {
      await db.task.update(task.id, {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      } as UpdateTaskPayload)
      await fetchTaskUpdate(task.id)
    } catch (e) {
      // 回滚：恢复原始时间
      task.original.start_time = previousStart
      task.original.end_time = previousEnd
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
