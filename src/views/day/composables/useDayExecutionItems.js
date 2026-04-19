/**
 * ============================================
 * Day 执行项模型 (views/day/composables/useDayExecutionItems.js)
 * ============================================
 *
 * 【模块职责】
 * - 构建统一格式的执行项数组
 * - 为每个执行项添加 sourceLabel 标识来源
 * - 提供执行项的标准化数据结构
 *
 * 【数据结构 - DayExecutionItem】
 * - id: 唯一标识
 * - sourceLabel: 'task' | 'daily_plan' | 'habit'  来源标签
 * - type: 类型同 sourceLabel（兼容现有逻辑）
 * - original: 原始数据对象
 * - startHour: 开始小时（浮点数）
 * - time: 格式化时间字符串
 * - duration/durationHours: 时长
 * - completed: 是否完成
 * - category: 分类标签
 * - title: 标题
 * - description: 描述
 */

import { formatDuration } from '@/utils/formatDuration'
import { isDailyPlanCompleted } from '@/utils/dailyPlanStatus'

/**
 * 构建日执行项数组
 * @param {Object} options - 构建选项
 * @param {Array} options.tasks - 任务列表
 * @param {Array} options.dailyPlans - 日计划列表
 * @param {Array} options.habits - 习惯列表
 * @param {Array} options.habitLogs - 习惯日志列表
 * @returns {Array} 执行项数组
 */
export function buildDayExecutionItems({ tasks = [], dailyPlans = [], habits = [], habitLogs = [] }) {
    const schedule = []

    // 1. 处理任务 - sourceLabel: 'task'
    tasks.forEach(task => {
        const startDate = new Date(task.start_time)
        const endDate = new Date(task.end_time)
        const startHourVal = startDate.getHours() + startDate.getMinutes() / 60
        const endHourVal = endDate.getHours() + endDate.getMinutes() / 60
        const durationHours = endHourVal - startHourVal
        const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

        schedule.push({
            id: task.id,
            sourceLabel: 'task',
            type: 'task',
            original: task,
            startHour: startHourVal,
            durationHours,
            rawDuration: durationHours,
            time: startTimeStr,
            duration: formatDuration(durationHours),
            category: '个人任务',
            title: task.title,
            description: task.description,
            completed: task.completed,
            actual_start_time: task.actual_start_time,
            actual_end_time: task.actual_end_time
        })
    })

    // 2. 处理日计划 - sourceLabel: 'daily_plan'
    dailyPlans.forEach(plan => {
        let startHourVal, startTimeStr, durationHours, durationStr

        // 计算继承的时间和时长
        const inheritedTime = plan.task_time || plan.monthly_plans?.task_time || plan.monthly_plans?.plans?.task_time
        const inheritedDuration = plan.duration || plan.monthly_plans?.duration || plan.monthly_plans?.plans?.duration || 30

        if (inheritedTime) {
            const [hours, minutes] = inheritedTime.split(':').map(Number)
            startHourVal = hours + minutes / 60
            startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
            durationHours = inheritedDuration / 60
            durationStr = formatDuration(durationHours)
        } else {
            startHourVal = undefined
            startTimeStr = '未安排'
            durationHours = 0
            durationStr = '-'
        }

        schedule.push({
            id: plan.id,
            sourceLabel: 'daily_plan',
            type: 'daily_plan',
            original: plan,
            startHour: startHourVal,
            durationHours,
            rawDuration: durationHours,
            time: startTimeStr,
            duration: durationStr,
            category: '今日计划',
            title: plan.title,
            description: plan.description || '',
            completed: isDailyPlanCompleted(plan.status)
        })
    })

    // 3. 处理习惯 - sourceLabel: 'habit'
    const habitLogIds = new Set(habitLogs.map(log => log.habit_id))

    habits.forEach(habit => {
        let startHourVal, startTimeStr, durationHours, durationStr
        if (habit.task_time) {
            const [hours, minutes] = habit.task_time.split(':').map(Number)
            startHourVal = hours + minutes / 60
            startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

            const durationMins = habit.duration || 30
            durationHours = durationMins / 60
            durationStr = formatDuration(durationHours)
        } else {
            startHourVal = undefined
            startTimeStr = '未安排'
            durationHours = 0
            durationStr = '-'
        }

        const isCompleted = habitLogIds.has(habit.id)

        schedule.push({
            id: habit.id,
            sourceLabel: 'habit',
            type: 'habit',
            original: habit,
            startHour: startHourVal,
            durationHours,
            rawDuration: durationHours,
            time: startTimeStr,
            duration: durationStr,
            category: '日常习惯',
            title: habit.title,
            description: habit.target_value ? `目标: ${habit.target_value}` : '',
            completed: isCompleted
        })
    })

    // 排序：按 startHour 排序，未安排的排在后面
    return schedule.sort((a, b) => {
        if (a.startHour !== undefined && b.startHour !== undefined) return a.startHour - b.startHour
        if (a.startHour !== undefined) return -1
        if (b.startHour !== undefined) return 1
        return 0
    })
}

/**
 * Day 执行项 Composable
 * 提供对执行项的响应式访问
 */
export function useDayExecutionItems() {
    return {
        buildDayExecutionItems
    }
}
