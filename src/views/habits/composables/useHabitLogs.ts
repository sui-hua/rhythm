import { computed, ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { db } from '@/services/database'
import { useHabitStore } from '@/stores/habitStore'
import { buildPatchedHabit } from './useHabitData'
import type { AugmentedHabit } from '@/types/models'
import type { HabitLog as DbHabitLog } from '@/services/db/habit'
import type { ViewContext } from './useHabitData'

// 格式化后的日志记录（用于展示）
export interface FormattedLog {
  id: string | number
  month: number
  day: number
  completedAt: string
  date: string
  logText: string
}

// useHabitLogsFormatter composable 的返回值接口
export interface UseHabitLogsFormatterReturn {
  formattedLogs: ComputedRef<FormattedLog[]>
}

/**
 * 格式化习惯日志列表，用于展示打卡记录
 *
 * @param logs - 原始日志记录数组（可能是 Ref 或直接数组）
 * @returns 格式化后的日志列表
 */
export function useHabitLogsFormatter(logs: Ref<DbHabitLog[]> | DbHabitLog[] | null): UseHabitLogsFormatterReturn {
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
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  })

  return { formattedLogs }
}

// useHabitLogs composable 的返回值接口
export interface UseHabitLogsReturn {
  toggleComplete: (day: number) => Promise<void>
  handleQuickLog: (note: string) => Promise<boolean>
  isSubmitting: Ref<boolean>
}

/**
 * 习惯打卡操作 composable
 *
 * 处理日期打卡切换（乐观更新）、快速打卡等写操作，
 * 包含失败回滚逻辑。
 *
 * @param selectedHabit - 当前选中的习惯（Ref）
 * @param viewYear - 日历当前查看的年份（Ref）
 * @param viewMonth - 日历当前查看的月份（Ref）
 * @param fetchHabits - 刷新习惯数据的回调函数
 * @returns 打卡操作方法和提交状态
 */
export function useHabitLogs(
  selectedHabit: ComputedRef<AugmentedHabit | null>,
  viewYear: Ref<number>,
  viewMonth: Ref<number>,
  fetchHabits: () => Promise<void>
): UseHabitLogsReturn {
    const habitStore = useHabitStore()

    // 写操作按钮 loading 状态，防止重复提交
    const isSubmitting: Ref<boolean> = ref(false)

    // 切换指定日期的打卡状态：已有则删除，没有则新增（乐观更新）
    const toggleComplete = async (day: number): Promise<void> => {
        // 前置检查：必须选中一个习惯，且当前没有提交操作进行中
        if (!selectedHabit.value || isSubmitting.value) return

        const habit = selectedHabit.value

        // 在内存中的 monthlyLogs 数组里查找该日期是否已有打卡记录
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at!).getDate() === day
        })

        isSubmitting.value = true

        // 乐观更新：先更新 UI，再同步数据库
        if (existingLog) {
            // 取消打卡：乐观移除该日的 log
            const updatedLogs = (habit.logs || []).filter(l => l.id !== existingLog.id)
            const updatedMonthlyLogs = (habit.monthlyLogs || []).filter(l => l.id !== existingLog.id)
            habitStore.patchHabit(String(habit.id), {
                logs: updatedLogs,
                monthlyLogs: updatedMonthlyLogs,
                completedDays: updatedMonthlyLogs.map((l: DbHabitLog) => new Date(l.completed_at!).getDate()),
                total: updatedLogs.length
            } as any)

            try {
                await db.habit.deleteLog(existingLog.id)
            } catch (e) {
                console.error('删除打卡记录失败，回滚:', e)
                // 失败回滚：重新拉取数据恢复一致状态
                await fetchHabits()
            } finally {
                isSubmitting.value = false
            }
        } else {
            // 新增打卡：乐观添加临时记录
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
            } as any)

            try {
                await db.habit.log(habit.id, '', date)
                // 数据库写入成功后刷新，获取真实 ID
                await fetchHabits()
            } catch (e) {
                console.error('新增打卡记录失败，回滚:', e)
                // 失败回滚：重新拉取数据恢复一致状态
                await fetchHabits()
            } finally {
                isSubmitting.value = false
            }
        }
    }

    // 快速添加今日打卡（乐观更新，支持备注文字）
    const handleQuickLog = async (note: string): Promise<boolean> => {
        // 前置检查：必须选中习惯、备注不能为空、当前没有提交操作进行中
        if (!selectedHabit.value || !note.trim() || isSubmitting.value) {
            console.warn('Habit not selected or note is empty')
            return false
        }

        const habit = selectedHabit.value
        const now = new Date()
        const today = now.getDate()

        // 检查该日期是否已有打卡
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at!).getDate() === today
        })

        if (existingLog) return false

        isSubmitting.value = true

        // 乐观更新：先创建临时记录更新 UI
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
        } as any)

        try {
            await db.habit.log(habit.id, note.trim(), date)
            // 数据库写入成功后刷新，获取真实 ID
            await fetchHabits()
            return true
        } catch (e) {
            console.error('Quick log failed, 回滚:', e)
            // 失败回滚：重新拉取数据恢复一致状态
            await fetchHabits()
            return false
        } finally {
            isSubmitting.value = false
        }
    }

    return {
        toggleComplete,
        handleQuickLog,
        isSubmitting
    }
}
