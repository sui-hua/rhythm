// useHabitLogs.ts
// 习惯模块的打卡写操作层，处理乐观更新和失败回滚

import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { db } from '@/services/database'
import { useActionFeedback } from '@/composables/useActionFeedback'
import { useActionLock } from '@/composables/useActionLock'
import { useHabitStore } from '@/stores/habitStore'
import { buildPatchedHabit } from './useHabitData'
import type { AugmentedHabit } from '@/types/models'
import type { HabitLog as DbHabitLog } from '@/services/db/habit'
import type { ViewContext } from './useHabitData'

// 格式化后的日志记录，用于打卡历史列表展示
export interface FormattedLog {
  id: string | number
  month: number
  day: number
  completedAt: string
  date: string
  logText: string
}

// useHabitLogsFormatter composable 的返回值类型
export interface UseHabitLogsFormatterReturn {
  formattedLogs: ComputedRef<FormattedLog[]>
}

/**
 * 格式化习惯日志列表
 *
 * 使用场景：打卡历史面板，将原始日志转为可展示的格式化数据
 * 数据流：原始 DbHabitLog[] → computed 格式化 → FormattedLog[]
 *
 * @param logs - 原始日志记录数组，支持 Ref 或直接数组
 * @returns 按时间倒序排列的格式化日志列表
 */
export function useHabitLogsFormatter(logs: Ref<DbHabitLog[]> | DbHabitLog[] | null): UseHabitLogsFormatterReturn {
  // 兼容 Ref 和直接数组两种入参形式
  const formattedLogs: ComputedRef<FormattedLog[]> = computed(() => {
    const source = Array.isArray(logs) ? logs : (logs as Ref<DbHabitLog[]>)?.value || []
    return source
      .map((log) => {
        const date = new Date(log.completed_at!)
        const month = date.getMonth() + 1
        const day = date.getDate()
        return {
          id: log.id,
          month,
          day,
          completedAt: log.completed_at!,
          date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
          logText: log.log || ''
        }
      })
      // 按完成时间倒序，最新打卡记录排在最前
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  })

  return { formattedLogs }
}

// useHabitLogs composable 的返回值类型
export interface UseHabitLogsReturn {
  toggleComplete: (day: number) => Promise<void>
  handleQuickLog: (note: string) => Promise<boolean>
  isSubmitting: Ref<boolean>
}

/**
 * 习惯打卡写操作
 *
 * 使用场景：Habits 模块的日历打卡和快速打卡功能
 * 数据流：用户操作 → 乐观更新 UI → 写入数据库 → 成功则刷新获取真实 ID / 失败则回滚
 *
 * @param selectedHabit - 当前选中的习惯（来自 useHabitData）
 * @param viewYear - 日历当前查看的年份（来自 useHabitData）
 * @param viewMonth - 日历当前查看的月份（来自 useHabitData）
 * @param fetchHabits - 刷新习惯数据的回调函数（来自 useHabitData）
 * @returns 打卡操作方法和提交状态
 */
export function useHabitLogs(
  selectedHabit: ComputedRef<AugmentedHabit | null>,
  viewYear: Ref<number>,
  viewMonth: Ref<number>,
  fetchHabits: () => Promise<void>
): UseHabitLogsReturn {
    const habitStore = useHabitStore()
    const { error } = useActionFeedback()
    const { isSubmitting, withLock } = useActionLock()

    /**
     * 切换指定日期的打卡状态：已有则删除，没有则新增
     *
     * 采用乐观更新策略：先更新 UI 再写数据库，失败时回滚到一致状态。
     * 新增打卡使用临时 ID（temp-xxx），写入成功后通过 fetchHabits 获取真实 ID。
     */
    const runToggleComplete = withLock(async (day: number): Promise<void> => {
        if (!selectedHabit.value) return
        const habit = selectedHabit.value

        // 在月度日志中查找该日期是否已有打卡记录
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at!).getDate() === day
        })

        if (existingLog) {
            // 取消打卡：先从内存中移除该日记录
            const updatedLogs = (habit.logs || []).filter(l => l.id !== existingLog.id)
            const updatedMonthlyLogs = (habit.monthlyLogs || []).filter(l => l.id !== existingLog.id)
            habitStore.patchHabit(String(habit.id), {
                logs: updatedLogs,
                monthlyLogs: updatedMonthlyLogs,
                completedDays: updatedMonthlyLogs.map((l) => new Date(l.completed_at!).getDate()),
                total: updatedLogs.length
            })

            try {
                await db.habit.deleteLog(existingLog.id)
            } catch (e) {
                error('取消打卡失败，已恢复数据', e)
                await fetchHabits()
            }
        } else {
            // 新增打卡：创建临时记录乐观更新 UI
            const date = new Date(viewYear.value, viewMonth.value, day, 12, 0, 0)
            const tempLog: DbHabitLog = {
                id: `temp-${Date.now()}`,
                habit_id: habit.id,
                completed_at: date.toISOString(),
                log: ''
            }

            const patched = buildPatchedHabit(habit, tempLog, {
                year: viewYear.value,
                month: viewMonth.value
            })
            habitStore.patchHabit(String(habit.id), {
                logs: patched.logs,
                monthlyLogs: patched.monthlyLogs,
                completedDays: patched.completedDays,
                total: patched.total
            })

            try {
                await db.habit.log(habit.id, '', date)
                // 写入成功后刷新，用真实记录替换临时 ID
                await fetchHabits()
            } catch (e) {
                error('打卡失败，已恢复数据', e)
                await fetchHabits()
            }
        }
    })

    const toggleComplete = async (day: number): Promise<void> => {
        await runToggleComplete(day)
    }

    /**
     * 快速添加今日打卡（带备注文字）
     *
     * 与 toggleComplete 类似的乐观更新策略，额外支持备注。
     * 若今日已有打卡记录则直接返回 false，不重复打卡。
     */
    const runQuickLog = withLock(async (note: string): Promise<boolean> => {
        if (!selectedHabit.value || !note.trim()) {
            console.warn('Habit not selected or note is empty')
            return false
        }

        const habit = selectedHabit.value
        const now = new Date()
        const today = now.getDate()

        // 检查今日是否已有打卡，避免重复
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at!).getDate() === today
        })

        if (existingLog) return false

        // 创建临时记录乐观更新 UI
        const date = new Date(now.getFullYear(), now.getMonth(), today, 12, 0, 0)
        const tempLog: DbHabitLog = {
            id: `temp-${Date.now()}`,
            habit_id: habit.id,
            completed_at: date.toISOString(),
            log: note.trim()
        }

        const patched = buildPatchedHabit(habit, tempLog, {
            year: now.getFullYear(),
            month: now.getMonth()
        })
        habitStore.patchHabit(String(habit.id), {
            logs: patched.logs,
            monthlyLogs: patched.monthlyLogs,
            completedDays: patched.completedDays,
            total: patched.total
        })

        try {
            await db.habit.log(habit.id, note.trim(), date)
            await fetchHabits()
            return true
        } catch (e) {
            error('快速打卡失败，已恢复数据', e)
            await fetchHabits()
            return false
        }
    })

    const handleQuickLog = async (note: string): Promise<boolean> => {
        return (await runQuickLog(note)) ?? false
    }

    return {
        toggleComplete,
        handleQuickLog,
        isSubmitting
    }
}
