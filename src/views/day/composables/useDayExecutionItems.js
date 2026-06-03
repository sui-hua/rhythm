import { formatDuration } from '@/utils/formatDuration'
import { isGoalDayCompleted } from '@/utils/goalDayStatus'
import { toDateOnly } from '@/utils/dateFormatter'

const formatCarryOverLabel = (dateOnly) => {
    const [, month, day] = dateOnly.split('-').map(Number)
    return `原计划 ${month}月${day}日`
}

export function buildDayExecutionItems({ targetDate = null, tasks = [], goalDays = [], habits = [], habitLogs = [] }) {
    const schedule = []
    const targetDateStr = targetDate ? toDateOnly(targetDate) : null

    // 阶段一：处理任务（sourceLabel: 'task'）
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

    // ============================================
    // 阶段二：处理 goal_day（sourceLabel: 'goal_day'）
    goalDays.forEach(plan => {
        let startHourVal, startTimeStr, durationHours, durationStr

        // 时间继承优先级：plan.task_time > goal_months.task_time > goal_months.goal.task_time
        const inheritedTime = plan.task_time || plan.goal_months?.task_time || plan.goal_months?.goal?.task_time
        const inheritedDuration = plan.duration || plan.goal_months?.duration || plan.goal_months?.goal?.duration || 30

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

        // 这里不改变原始 day，只在展示层标记它是历史未完成补查项，
        // 这样 Sidebar 和 Timeline 都能用同一份语义提示用户“这不是改了日期”。
        const isCarryOver = Boolean(
            targetDateStr &&
            plan.day &&
            plan.day < targetDateStr &&
            !isGoalDayCompleted(plan.status)
        )

        schedule.push({
            id: plan.id,
            sourceLabel: 'goal_day',
            type: 'goal_day',
            original: plan,
            startHour: startHourVal,
            durationHours,
            rawDuration: durationHours,
            time: startTimeStr,
            duration: durationStr,
            category: '今日计划',
            title: plan.title,
            description: plan.description || '',
            completed: isGoalDayCompleted(plan.status),
            isCarryOver,
            carryOverSourceDate: isCarryOver ? plan.day : null,
            carryOverLabel: isCarryOver ? formatCarryOverLabel(plan.day) : ''
        })
    })

    // ============================================
    // 阶段三：处理习惯（sourceLabel: 'habit'）
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

        // 判断习惯是否已完成（当日是否有日志记录）
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

    // ============================================
    // 按 startHour 升序，未安排的排最后
    return schedule.sort((a, b) => {
        if (a.startHour !== undefined && b.startHour !== undefined) return a.startHour - b.startHour
        if (a.startHour !== undefined) return -1
        if (b.startHour !== undefined) return 1
        return 0
    })
}

export function useDayExecutionItems() {
    return {
        buildDayExecutionItems
    }
}
