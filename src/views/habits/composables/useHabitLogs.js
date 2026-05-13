/**
 * ============================================
 * 习惯打卡与日志管理 (views/habits/composables/useHabitLogs.js)
 * ============================================
 *
 * 【模块职责】
 * 本模块提供两个 Composable 用于习惯打卡功能：
 * - useHabitLogsFormatter → 格式化打卡日志展示
 * - useHabitLogs → 处理打卡/取消打卡操作
 *
 * 【打卡日志格式化 - useHabitLogsFormatter】
 * - 将 completed_at 时间戳转换为 MM/DD 格式日期字符串
 * - 按时间降序排列（最近优先）
 * - 提取 id、month、day、logText 等字段供组件直接使用
 *
 * 【打卡操作 - useHabitLogs】
 * - toggleComplete(day) → 点击日历日期切换打卡状态（有则删除，无则新增）
 * - handleQuickLog(note) → 快速添加今日打卡（支持用户输入备注文字）
 *
 * 【防抖处理】
 * - isSubmitting 状态锁防止重复提交
 * - 操作进行中时禁用按钮，避免数据库并发写入
 *
 * 【依赖说明】
 * - db: database.js 导出的数据库服务实例，提供 habits.log / habits.deleteLog 方法
 * - dateStore: 日期状态仓库，用于获取当前选中日期
 *
 * @see {@link https://github.com/rhythm/rhythm | 项目源码}
 * @module habits/composables/useHabitLogs
 */
import { computed, ref } from 'vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'

/**
 * 格式化习惯打卡日志 (Composable)
 *
 * 将原始打卡日志数组转换为组件所需的展示格式，包括：
 * - 将时间戳拆分为 month（月份 1-12）和 day（日期 1-31）
 * - 生成 MM/DD 格式的 date 字符串用于显示
 * - 保留原始 id、completed_at、logText 字段
 * - 按 completed_at 降序排列（最近打卡优先展示）
 *
 * @param {Array<Object>} logs - 原始打卡日志数组，每项应包含 id、completed_at、log 等字段
 * @returns {{ formattedLogs: ComputedRef<Array> }} formattedLogs - 格式化后的日志计算属性
 *
 * @example
 * const logs = [
 *   { id: 1, completed_at: '2026-04-20T10:00:00Z', log: '晨跑完成' },
 *   { id: 2, completed_at: '2026-04-19T09:00:00Z', log: '' }
 * ]
 * const { formattedLogs } = useHabitLogsFormatter(logs)
 * // formattedLogs.value[0].date === '04/20'
 */
export function useHabitLogsFormatter(logs) {
  /**
   * 格式化后的日志数据源
   *
   * 对原始日志数据进行转换处理：
   * 1. 遍历每条日志，从 completed_at 时间戳中提取月份和日期
   * 2. 生成两位数补零的 MM/DD 格式日期字符串
   * 3. 按打卡时间降序排列（最新的排在前面）
   *
   * @type {ComputedRef<Array<{id: number, month: number, day: number, completedAt: string, date: string, logText: string}>>}
   */
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

/**
 * 习惯打卡与日志记录提交逻辑 (Composable)
 *
 * 封装所有与习惯打卡相关的数据库写入操作：
 * - 新增打卡记录（toggleComplete 创建新记录）
 * - 撤销打卡记录（toggleComplete 删除已有记录）
 * - 快速打卡并附带用户备注（handleQuickLog）
 *
 * 该 Composable 负责与 db.habit 进行交互，完成后调用 fetchHabits 刷新界面数据。
 *
 * @param {Ref<Object>} selectedHabit - 当前选中的习惯对象，包含 id 和 monthlyLogs 等属性
 * @param {Ref<number>} viewYear - 日历视图所在的年份（用于确定新建打卡记录的日期）
 * @param {Ref<number>} viewMonth - 日历视图所在的月份（0-11，与 JS Date 一致）
 * @param {Function} fetchHabits - 打卡操作成功后调用的回调，用于刷新习惯列表数据
 * @returns {{ toggleComplete: Function, handleQuickLog: Function, isSubmitting: Ref<boolean> }}
 *
 * @example
 * const habit = ref({ id: 1, monthlyLogs: [] })
 * const { toggleComplete, handleQuickLog, isSubmitting } = useHabitLogs(habit, year, month, fetchHabits)
 */
export function useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits) {
    /** 日期状态仓库，用于获取日历视窗中选中的日期信息 */
    const dateStore = useDateStore()

    /**
     * 写操作按钮 loading 状态
     * 防止用户快速点击导致重复提交。当 isSubmitting 为 true 时，所有写操作都会提前返回
     * @type {Ref<boolean>}
     */
    const isSubmitting = ref(false)

    /**
     * 切换指定日期的打卡状态（新增或删除）
     *
     * 该方法是习惯打卡的核心操作，实现了" Toggle "语义：
     * - 如果该日期已有打卡记录 → 删除该记录（取消打卡）
     * - 如果该日期没有打卡记录 → 创建新记录（完成打卡）
     *
     * 操作流程：
     * 1. 前置检查：确保已选中习惯且当前没有提交操作进行中
     * 2. 查找该日期是否已有打卡记录（通过对比日期数字）
     * 3. 根据是否存在记录执行删除或新增操作
     * 4. 成功后调用 fetchHabits 刷新界面
     *
     * @param {number} day - 要切换打卡的日期（1-31）
     * @returns {Promise<void>}
     *
     * @example
     * // 用户点击日历上的第 15 天
     * await toggleComplete(15)
     */
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

    /**
     * 快速添加今日打卡（支持用户输入备注文字）
     *
     * 这是一个便捷方法，专门用于"今日打卡"场景，与 toggleComplete 的区别在于：
     * 1. 固定使用系统当前日期（不受日历视图月份影响）
     * 2. 支持用户输入的备注文字
     * 3. 仅当日历视窗中的"今天"尚未打卡时才创建记录
     *
     * 典型使用场景：用户通过卡片底部的快速输入框提交今日打卡
     *
     * @param {string} note - 用户输入的打卡备注/心情文字
     * @returns {Promise<boolean>} 返回 true 表示提交成功，false 表示失败或未执行
     *
     * @example
     * const success = await handleQuickLog('今天的晨跑感觉特别棒！')
     * if (success) {
     *   // 清空输入框
     *   input.value = ''
     * }
     */
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

    /**
     * 导出的公共接口
     * @type {{ toggleComplete: Function, handleQuickLog: Function, isSubmitting: Ref<boolean> }}
     */
    return {
        /** 切换指定日期的打卡状态（新增/删除） @type {Function} */
        toggleComplete,
        /** 快速添加今日打卡（支持备注） @type {Function} */
        handleQuickLog,
        /** 提交状态锁，防止重复提交 @type {Ref<boolean>} */
        isSubmitting
    }
}


