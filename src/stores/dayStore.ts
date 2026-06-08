/**
 * 每日时间轴状态管理
 *
 * 聚合 Task、DailyPlan、Habit 三种数据源，生成统一日程列表。
 * 职责精简为：状态定义、数据拉取、computed 派生。
 * 操作类逻辑（完成切换、计时、顺延等）委托给 useDayActions。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { useHabitStore } from '@/stores/habitStore'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildDayExecutionItems } from '@/utils/dayExecutionItems'
import { matchesHabitFrequency } from '@/utils/habitFrequency'
import { safeAction } from '@/utils/safeAction'
import { useDayActions } from '@/views/day/composables/useDayActions'
import type { Task } from '@/services/db/task'
import type { GoalDay } from '@/services/db/goalDays'
import type { Habit, HabitLog } from '@/services/db/habit'
import type { DailyScheduleItem } from '@/types/models'

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

  // ── 操作逻辑委托 ──
  // 从 useDayActions 获取操作函数，传入 tasks ref、日期上下文、日程列表和习惯日志
  const {
    handleToggleComplete,
    handleStartTask,
    updateTaskTime,
    carryOverUncompletedTasksTo,
    fetchTaskUpdate
  } = useDayActions({ tasks, routeDateContext, dailySchedule, habitLogs, goalDays })

  // ── Actions ──
  // 拉取当日所有数据（任务、计划、习惯、习惯日志），并行请求减少等待时间
  const fetchTasks = async (options: FetchTasksOptions = {}): Promise<void> => {
    const { showLoading = true } = options
    if (showLoading) isLoading.value = true
    try {
      await safeAction(async () => {
        const { year, month, day } = routeDateContext.value
        const monthZeroBased = month - 1

        const startOfDay = new Date(year, monthZeroBased, day, 0, 0, 0)
        const endOfDay = new Date(year, monthZeroBased, day, 23, 59, 59)

        // 确保习惯数据已加载到 habitStore 缓存（Day 页面不会单独调用 fetchHabits）
        const habitStore = useHabitStore()
        if (habitStore.habits.length === 0 && !habitStore.loading) {
          await habitStore.fetchHabits()
        }

        // 三个数据源并行请求，习惯列表从 habitStore 缓存读取
        const [fetchedTasks, fetchedPlans, dayHabitLogs] = await Promise.all([
          db.task.list(startOfDay, endOfDay),
          db.goalDays.listForDayView(startOfDay),
          db.habit.listLogsByDate(startOfDay, endOfDay)
        ])

        tasks.value = fetchedTasks || []

        // 检查是否有正在运行的任务，自动同步到番茄钟 store
        // 避免用户刷新页面后丢失正在进行的计时状态
        const runningTask = tasks.value.find(t =>
          t.start_time && !t.completed
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
        // 从 habitStore 缓存读取活跃习惯，过滤匹配当日频率的项
        habits.value = habitStore.habits.filter((habit: Habit) => {
          return habit.frequency
            && matchesHabitFrequency(habit.frequency, startOfDay)
        })
        habitLogs.value = dayHabitLogs
      }, '获取日数据失败')
    } finally {
      if (showLoading) isLoading.value = false
    }
  }

  // 手动设置加载状态，供外部组件在特殊场景下控制
  const setLoading = (value: boolean): void => {
    isLoading.value = value
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
