/**
 * useDayActions — 日页面操作逻辑 composable
 *
 * 从 dayStore 提取的任务完成切换、习惯打卡、日计划状态变更、任务计时、
 * 任务时间更新、任务顺延等操作。每个函数接收必要的 store refs 作为参数，
 * 不直接依赖 pomodoroStore，改为返回值让调用方处理。
 *
 * 数据流：组件 → useDayActions（乐观更新 + API 调用）→ 数据库
 */

import { db } from '@/services/database'
import { playSuccessSound } from '@/utils/audio'
import { useDateStore } from '@/stores/dateStore'
import type { Ref } from 'vue'
import type { Task } from '@/services/db/task'
import type { GoalDay } from '@/services/db/goalDays'
import type { Habit, HabitLog } from '@/services/db/habit'
import type { DailyScheduleItem, ActiveTask, TaskScheduleItem } from '@/types/models'
import type { UpdateTaskPayload } from '@/services/db/task'

/** 日期上下文（年月日分量） */
interface DateContext {
  year: number
  month: number
  day: number
}

/** useDayActions 的参数，由 dayStore 传入其内部 refs */
export interface UseDayActionsOptions {
  /** 当日任务列表 */
  tasks: Ref<Task[]>
  /** 日期上下文 computed */
  routeDateContext: Ref<DateContext>
  /** 当日日程列表（computed），用于通过 ID 定位原始对象 */
  dailySchedule: Ref<DailyScheduleItem[]>
  /** 当日习惯日志列表，toggle 后需同步更新以驱动 computed 重算 */
  habitLogs: Ref<HabitLog[]>
}

/** handleStartTask 返回值，由调用方（组件）决定如何同步到 pomodoroStore */
export interface StartTaskResult {
  /** 构造好的 ActiveTask 对象，可直接传给 pomodoroStore.setActiveTask */
  activeTask: ActiveTask
}

/**
 * 日页面操作逻辑
 *
 * 使用场景：day 模块的任务完成切换、计时、时间更新、顺延等
 * 数据流：组件调用 → 乐观更新 → API → 成功/回滚
 */
export function useDayActions({ tasks, routeDateContext, dailySchedule, habitLogs }: UseDayActionsOptions) {
  const dateStore = useDateStore()

  // ── 私有辅助 ──

  /**
   * 获取当日的起止时间范围，用于数据库查询
   * 从 routeDateContext 派生，确保与当前选中日期一致
   */
  const getCurrentDayRange = (): { startOfDay: Date; endOfDay: Date } => {
    const { year, month, day } = routeDateContext.value
    return {
      startOfDay: new Date(year, month - 1, day, 0, 0, 0),
      endOfDay: new Date(year, month - 1, day, 23, 59, 59)
    }
  }

  /**
   * 单条任务同步：通过 ID 精确查询，避免全量拉取的性能开销
   * 更新 tasks ref 中对应条目的数据
   */
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

  // ── 内部操作 ──

  /** 切换任务完成状态，通过 completed 布尔字段控制 */
  const toggleTaskCompletion = async (task: TaskScheduleItem): Promise<void> => {
    // task.completed 已在调用前被乐观更新翻转，直接用当前值
    const updates: UpdateTaskPayload = { completed: task.completed }
    // 完成时记录实际结束时间，用于统计任务耗时
    if (task.completed) {
      updates.actual_end_time = new Date().toISOString()
    }
    await db.task.update(task.id, updates)
  }

  /**
   * 切换习惯完成状态：目标状态为已完成则添加日志，否则删除日志
   * API 成功后同步更新 habitLogs ref，驱动 dailySchedule computed 重算
   */
  const toggleHabitCompletion = async (task: DailyScheduleItem): Promise<void> => {
    if (task.completed) {
      // 标记完成：创建日志并同步到本地 ref
      const { startOfDay } = getCurrentDayRange()
      const newLog = await db.habit.log(task.id, '', startOfDay)
      habitLogs.value = [...habitLogs.value, newLog]
      return
    }

    // 取消完成：查找并删除当日日志
    const { startOfDay, endOfDay } = getCurrentDayRange()
    const logs = await db.habit.listLogsByDate(startOfDay, endOfDay)
    const log = logs.find((item: HabitLog) => String(item.habit_id) === String(task.id))
    if (log) {
      await db.habit.deleteLog(log.id)
      // 从本地 ref 中移除该日志，触发 dailySchedule 重算
      habitLogs.value = habitLogs.value.filter(l => String(l.id) !== String(log.id))
    }
  }

  /** 切换日计划完成状态，直接使用字符串值 */
  const toggleDailyPlanCompletion = async (task: DailyScheduleItem): Promise<void> => {
    const newStatus = task.completed ? 'completed' : 'active'
    await db.goalDays.update(task.id, { status: newStatus })
  }

  // ── 导出 Actions ──

  /**
   * 切换完成状态（乐观更新），根据 task.type 分发到对应的处理函数
   * 完成时播放音效反馈，失败时回滚到原始状态
   *
   * 注意：调用方（Sidebar）传入的 task 可能是 dailySchedule 的展开拷贝，
   * 必须通过 ID 找到 store 中的原始对象进行修改，否则不会触发响应式更新。
   */
  const handleToggleComplete = async (task: DailyScheduleItem): Promise<void> => {
    if (!task) return

    // 在 store 的 dailySchedule 中找到原始对象，避免修改拷贝导致 UI 不更新
    const originalItem = dailySchedule.value.find(t => String(t.id) === String(task.id))
    const target = originalItem || task

    // 乐观更新：先在本地修改状态，提升 UI 响应速度
    const previousState = target.completed
    target.completed = !target.completed

    try {
      if (task.type === 'task') {
        await toggleTaskCompletion(target as TaskScheduleItem)
        await fetchTaskUpdate(task.id)
      }
      if (task.type === 'habit') {
        await toggleHabitCompletion(target)
      }
      if (task.type === 'goal_day') {
        await toggleDailyPlanCompletion(target)
      }

      // 完成时播放音效反馈，取消完成时不播放
      if (!previousState) {
        playSuccessSound()
      }
    } catch (e) {
      // 回滚：恢复原始状态，确保 UI 与数据库一致
      target.completed = previousState
      console.error('切换完成状态失败', e)
    }
  }

  /**
   * 开始任务计时（乐观更新）
   * 返回 StartTaskResult，由调用方决定如何同步到 pomodoroStore
   * 这样避免了 composable 直接依赖 pomodoroStore
   */
  const handleStartTask = async (task: DailyScheduleItem): Promise<StartTaskResult | null> => {
    if (!task || task.type !== 'task') return null
    const startTime = new Date().toISOString()

    // 乐观更新：立即反映在 UI 上
    task.actual_start_time = startTime
    task.actual_end_time = null

    try {
      await db.task.update(task.id, {
        start_time: startTime,
        completed: false
      } as UpdateTaskPayload)
      await fetchTaskUpdate(task.id)

      // 返回构造好的 ActiveTask，由调用方同步到 pomodoroStore
      return {
        activeTask: {
          id: task.id,
          title: task.title,
          type: 'task',
          completed: task.completed,
          start_time: task.original.start_time,
          end_time: task.original.end_time,
          actual_start_time: startTime,
          actual_end_time: null,
          original: task.original
        }
      }
    } catch (e) {
      // 回滚：清除乐观更新的值
      task.actual_start_time = null
      console.error('开始计时失败', e)
      return null
    }
  }

  /**
   * 更新任务时间（乐观更新），支持拖拽时间轴调整时间段
   * 将小数小时转换为时分，如 9.5 → 9:30
   */
  const updateTaskTime = async (task: DailyScheduleItem, newStartHour: number, newEndHour: number): Promise<void> => {
    if (!task || task.type !== 'task') return
    const { year, month, day } = routeDateContext.value
    const baseDate = new Date(year, month - 1, day)

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

  /**
   * 顺延未完成任务到目标日期，仅顺延一周内创建的任务，避免历史遗留任务堆积
   * 源日期为目标日期的前一天
   */
  const carryOverUncompletedTasksTo = async (targetDate: Date): Promise<void> => {
    if (!targetDate) return

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
      const uncompleted = (sourceTasks || []).filter((t: Task) => !t.completed).filter((t: Task) => {
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

  return {
    handleToggleComplete,
    handleStartTask,
    updateTaskTime,
    carryOverUncompletedTasksTo,
    fetchTaskUpdate
  }
}
