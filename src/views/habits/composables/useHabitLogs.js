import { computed, ref } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

export function useHabitLogsFormatter(logs) {
  const formattedLogs = computed(() => {
    return (logs || [])
      .map(log => {
        // 解析打卡时间戳，getMonth() 返回 0-11，所以需要 +1
        const date = new Date(log.completed_at)
        const month = date.getMonth() + 1
        const day = date.getDate()
        return {
          id: log.id,                                    // 日志唯一标识
          month,                                         // 月份（1-12）
          day,                                           // 日期（1-31）
          completedAt: log.completed_at,                 // 原始 ISO 时间戳
          // 格式化为 MM/DD，如 04/20，确保月份和日期都两位数显示
          date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
          logText: log.log || ''                         // 用户输入的打卡备注
        }
      })
      // 按完成时间降序排列，最新的打卡记录排在数组前面
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  })

  return { formattedLogs }
}

export function useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits) {
    const dateStore = useDateStore()

    // 写操作按钮 loading 状态，防止重复提交
    const isSubmitting = ref(false)

    // 切换指定日期的打卡状态：已有则删除，没有则新增
    const toggleComplete = async (day) => {
        // 前置检查：必须选中一个习惯，且当前没有提交操作进行中
        if (!selectedHabit.value || isSubmitting.value) return

        const habit = selectedHabit.value

        // 在内存中的 monthlyLogs 数组里查找该日期是否已有打卡记录
        // 注意：这里只比较日期数字，忽略年份和月份（因为 monthlyLogs 只包含当月数据）
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at).getDate() === day
        })

        isSubmitting.value = true
        try {
            if (existingLog) {
                // 情况一：该日期已有打卡 → 删除记录（取消打卡）
                // 使用数据库服务的 deleteLog 方法根据日志 ID 删除
                await db.habit.deleteLog(existingLog.id)
            } else {
                // 情况二：该日期没有打卡 → 创建新记录（完成打卡）
                // 构建该日正午 12:00 的日期对象（避免午夜时分导致日期偏移）
                const date = new Date(viewYear.value, viewMonth.value, day, 12, 0, 0)
                // 传入空字符串作为备注（toggleComplete 不支持备注）
                await db.habit.log(habit.id, '', date.toISOString())
            }

            // 数据库操作成功后，调用回调函数刷新习惯列表
            // 这是为了保证界面显示的数据与数据库一致
            await fetchHabits()
        } catch (e) {
            // 错误处理：打印错误日志但不抛出异常（调用方无法处理）
            console.error('Toggle habit log failed', e)
        } finally {
            // 不论成功或失败，都要重置提交状态锁，允许下一次操作
            isSubmitting.value = false
        }
    }

    // 快速添加今日打卡（使用系统真实日期，支持备注文字）
    const handleQuickLog = async (note) => {
        // 前置检查：必须选中习惯、备注不能为空、当前没有提交操作进行中
        if (!selectedHabit.value || !note.trim() || isSubmitting.value) {
            console.warn('Habit not selected or note is empty')
            return false
        }

        isSubmitting.value = true
        try {
            // 获取系统当前时间（注意：这里用 real now，不受日历翻页影响）
            const now = new Date()

            // 提取当前日期的数字部分（1-31）
            // 这是为了避免 viewMonth 可能是上个月或下个月的情况
            const today = now.getDate()

            // 再次检查该日期是否已有打卡（防止用户重复点击）
            // 同样使用日期数字比较，忽略年份月份
            const existingLog = selectedHabit.value.monthlyLogs.find((log) => {
                return new Date(log.completed_at).getDate() === today
            })

            // 只有在今天尚未打卡的情况下才创建新记录
            if (!existingLog) {
                // 同样使用系统当前时间构建日期，确保记录的是真实的"今天"
                const date = new Date(
                    now.getFullYear(),   // 当前年份
                    now.getMonth(),      // 当前月份（0-11）
                    today,               // 当前日期
                    12,                  // 正午 12:00（避免时间偏移）
                    0,                   // 分钟
                    0                    // 秒
                )
                // 调用数据库服务创建打卡记录，包含用户输入的备注
                await db.habit.log(selectedHabit.value.id, note.trim(), date.toISOString())
            }

            // 操作成功后刷新习惯列表
            await fetchHabits()
            return true
        } catch (e) {
            // 错误处理：记录日志并返回失败标识
            console.error('Quick log failed', e)
            return false
        } finally {
            // 重置提交状态锁
            isSubmitting.value = false
        }
    }

    return {
        toggleComplete,
        handleQuickLog,
        isSubmitting
    }
}
