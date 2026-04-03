import { computed } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

/**
 * 格式化习惯打卡日志 (Composable)
 * 将原始日志数据格式化为组件所需的展示格式，并按时间降序排列。
 * @param {Array} logs - 原始打卡日志数组
 */
export function useHabitLogsFormatter(logs) {
  /**
   * 格式化后的日志数据源
   * 对原有的乱序或不统一的记录按 `completed_at` 打卡时间做格式转换并降序排列 (最近的数据优先展出)。
   */
  const formattedLogs = computed(() => {
    return (logs || [])
      .map(log => {
        const date = new Date(log.completed_at)
        const month = date.getMonth() + 1
        const day = date.getDate()
        return {
          id: log.id,
          month,
          day,
          completedAt: log.completed_at,
          date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
          logText: log.log || ''
        }
      })
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  })

  return { formattedLogs }
}

/**
 * 习惯打卡与日志记录提交逻辑 (Composable)
 * 主要封装牵涉需要向核心数据库发送写入、撤销等对 Logs 表变更的操作。
 * @param {Ref<Object>} selectedHabit - 页面主体查阅的活动习惯状态数据 (为打卡归属主体)
 * @param {Ref<number>} viewYear - 日历现在正处于何年的定位器值
 * @param {Ref<number>} viewMonth - 日历现在处于何月的定位器值
 * @param {Function} fetchHabits - 完成写入之后提供回调更新界面的查询刷新方法传递引介
 */
export function useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits) {
    const dateStore = useDateStore()

    /**
     * 为某特定的日期天数切换它的已读和打卡状态：通过检索判断实现其“增、删”。
     * 若原本已被打卡则做删除(撤回)工作；原本是空白便进行生成新的记录日志工作。
     * @param {number} day - 点击发生时回传出的对应特定具体天日期的标号数字
     */
    const toggleComplete = async (day) => {
        if (!selectedHabit.value) return

        const habit = selectedHabit.value
        // 在内存已有数据中预先查询这天中是否带有相关的 log
        const existingLog = habit.monthlyLogs.find((log) => {
            return new Date(log.completed_at).getDate() === day
        })

        try {
            if (existingLog) {
                // 清理撤销打卡
                await db.habits.deleteLog(existingLog.id)
            } else {
                // 增发新增打卡
                // 设置时间为对应日历视窗上的某日正午时间12:00防偏
                const date = new Date(viewYear.value, viewMonth.value, day, 12, 0, 0)
                await db.habits.log(habit.id, '', date.toISOString())
            }

            // 成功更改数据表记录之后指令框架再次请求加载刷新
            await fetchHabits()
        } catch (e) {
            console.error('Toggle habit log failed', e)
        }
    }

    /**
     * 快速简易输入今天心语并附带在打卡信息保存。主要运用于卡片式的快捷输入窗。
     * @param {string} note - 所传递的快速总结打卡文字信息详情
     * @returns {Promise<boolean>} 是否完成了提交以使前台对文本框等执行复位清理
     */
    const handleQuickLog = async (note) => {
        if (!selectedHabit.value || !note.trim()) {
            console.warn('Habit not selected or note is empty')
            return false
        }

        try {
            const now = new Date()
            // 这里对齐目前主数据真实流时间的“今天”而规避上述由于翻页查看的 viewMonth 月份漂移现象
            const today = now.getDate()

            // 预先筛查以杜绝针对单个今天因频繁重送而导致多余脏数据存入
            const existingLog = selectedHabit.value.monthlyLogs.find((log) => {
                return new Date(log.completed_at).getDate() === today
            })

            // 如果未被打卡覆盖，则伴随文本存储到最新记录体系内
            if (!existingLog) {
                // 同样基于系统当前的现实时间，不被左侧日历面板等其它组件的操作带偏
                const date = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    today,
                    12,
                    0,
                    0
                )
                await db.habits.log(selectedHabit.value.id, note.trim(), date.toISOString())
            }

            await fetchHabits()
            return true
        } catch (e) {
            console.error('Quick log failed', e)
            return false
        }
    }
    return {
        toggleComplete,
        handleQuickLog
    }
}


