/**
 * ============================================
 * Day 执行项模型 (views/day/composables/useDayExecutionItems.js)
 * ============================================
 *
 * 【模块职责】
 * - 构建统一格式的执行项数组，统一呈现 Task、DailyPlan、Habit 三种数据源
 * - 为每个执行项添加 sourceLabel 标识来源，便于前端区分渲染
 * - 提供执行项的标准化数据结构，包含时间、时长、状态等统一字段
 *
 * 【使用场景】
 * - Day 视图的时间轴展示（Timeline）
 * - 日执行项的统计和筛选
 *
 * 【数据结构 - DayExecutionItem】
 * | 字段           | 类型           | 说明                                      |
 * |----------------|----------------|-------------------------------------------|
 * | id             | string/number  | 唯一标识                                  |
 * | sourceLabel    | string         | 'task' | 'daily_plan' | 'habit' 来源标识     |
 * | type           | string         | 同 sourceLabel，维持向后兼容              |
 * | original       | object         | 原始数据对象引用，便于反向查找            |
 * | startHour      | number|undefined | 开始小时（浮点数），如 9.5 表示 9:30      |
 * | time           | string         | 格式化时间字符串，如 "09:30"              |
 * | durationHours  | number         | 时长（小时），如 1.5 表示 1 小时 30 分钟  |
 * | rawDuration    | number         | 同 durationHours，保留原始值              |
 * | duration       | string         | 格式化时长字符串，如 "1小时30分钟"         |
 * | completed      | boolean        | 是否完成                                  |
 * | category       | string         | 分类标签：'个人任务' | '今日计划' | '日常习惯' |
 * | title          | string         | 标题                                      |
 * | description    | string         | 描述或备注                                |
 *
 * 【三种数据源对比】
 * | 来源        | 时间来源          | 完成状态判断              | 分类标签  |
 * |-------------|-------------------|--------------------------|-----------|
 * | task        | start_time        | task.completed           | 个人任务  |
 * | daily_plan  | task_time 或继承   | isDailyPlanCompleted()   | 今日计划  |
 * | habit       | task_time         | habitLog 中是否存在      | 日常习惯  |
 *
 * @module useDayExecutionItems
 */

import { formatDuration } from '@/utils/formatDuration'
import { isDailyPlanCompleted } from '@/utils/dailyPlanStatus'

/**
 * 构建日执行项数组
 *
 * 将 Task、DailyPlan、Habit 三种数据源统一转换为标准执行项数组，
 * 每个执行项包含统一的时间、时长、分类等字段，便于前端统一渲染。
 *
 * 【处理流程】
 * 1. 遍历 tasks，将每个任务转换为执行项（sourceLabel: 'task'）
 * 2. 遍历 dailyPlans，将每个日计划转换为执行项（sourceLabel: 'daily_plan'）
 * 3. 遍历 habits，结合 habitLogs 判断完成状态后转换为执行项（sourceLabel: 'habit'）
 * 4. 按 startHour 从小到大排序，未安排时间（startHour 为 undefined）的排在最后
 *
 * 【时间计算规则】
 * - task: 直接从 start_time 和 end_time 计算
 * - daily_plan: 优先使用 task_time，若无则尝试继承 monthly_plans 中的时间
 * - habit: 直接从 task_time 读取，默认时长 30 分钟
 *
 * @param {Object} options - 构建选项
 * @param {Array} [options.tasks=[]] - 任务列表，每个任务应包含 id, title, description, start_time, end_time, completed 等字段
 * @param {Array} [options.dailyPlans=[]] - 日计划列表，每个计划应包含 id, title, description, task_time, duration, status 等字段
 * @param {Array} [options.habits=[]] - 习惯列表，每个习惯应包含 id, title, task_time, duration, target_value 等字段
 * @param {Array} [options.habitLogs=[]] - 习惯日志列表，用于判断习惯是否已完成，每个日志应包含 habit_id 字段
 * @returns {Array<DayExecutionItem>} 执行项数组，按 startHour 升序排列
 *
 * @example
 * const items = buildDayExecutionItems({
 *   tasks: [{ id: 1, title: '会议', start_time: '2024-01-01T09:00:00', end_time: '2024-01-01T10:00:00' }],
 *   dailyPlans: [],
 *   habits: [],
 *   habitLogs: []
 * })
 */
export function buildDayExecutionItems({ tasks = [], dailyPlans = [], habits = [], habitLogs = [] }) {
    /** @type {Array} 执行项数组 */
    const schedule = []

    // ============================================
    // 阶段一：处理任务（sourceLabel: 'task'）
    // ============================================
    /**
     * 遍历任务列表，构建任务执行项
     * 时间来源：task.start_time 和 task.end_time
     * 完成状态：task.completed 布尔值
     */
    tasks.forEach(task => {
        // 解析开始和结束时间
        const startDate = new Date(task.start_time)
        const endDate = new Date(task.end_time)

        // 将时间转换为小时浮点数表示（如 9:30 → 9.5），便于排序
        const startHourVal = startDate.getHours() + startDate.getMinutes() / 60
        const endHourVal = endDate.getHours() + endDate.getMinutes() / 60

        // 计算时长（小时）
        const durationHours = endHourVal - startHourVal

        // 格式化开始时间为 "HH:MM" 字符串
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
    // 阶段二：处理日计划（sourceLabel: 'daily_plan'）
    // ============================================
    /**
     * 遍历日计划列表，构建日计划执行项
     * 时间来源：优先使用 task_time，继承自 monthly_plans.task_time 或 plans.task_time
     * 完成状态：isDailyPlanCompleted(plan.status) 判断
     */
    dailyPlans.forEach(plan => {
        let startHourVal, startTimeStr, durationHours, durationStr

        // 计算继承的时间和时长
        // 优先级：plan.task_time > monthly_plans.task_time > monthly_plans.plans.task_time
        const inheritedTime = plan.task_time || plan.monthly_plans?.task_time || plan.monthly_plans?.plans?.task_time
        // 优先级：plan.duration > monthly_plans.duration > monthly_plans.plans.duration > 30
        const inheritedDuration = plan.duration || plan.monthly_plans?.duration || plan.monthly_plans?.plans?.duration || 30

        if (inheritedTime) {
            // 解析时间字符串 "HH:MM" 并转换为小时浮点数
            const [hours, minutes] = inheritedTime.split(':').map(Number)
            startHourVal = hours + minutes / 60
            startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
            // 时长从分钟转换为小时
            durationHours = inheritedDuration / 60
            durationStr = formatDuration(durationHours)
        } else {
            // 无时间信息时设为未安排状态
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

    // ============================================
    // 阶段三：处理习惯（sourceLabel: 'habit'）
    // ============================================
    /**
     * 遍历习惯列表，结合 habitLogs 判断完成状态后构建执行项
     * 时间来源：habit.task_time
     * 完成状态：habitLog 中是否存在对应 habit_id
     * 描述：显示目标值 target_value
     */
    // 构建 habit_id 集合，用于快速查找
    const habitLogIds = new Set(habitLogs.map(log => log.habit_id))

    habits.forEach(habit => {
        let startHourVal, startTimeStr, durationHours, durationStr

        if (habit.task_time) {
            // 解析时间字符串
            const [hours, minutes] = habit.task_time.split(':').map(Number)
            startHourVal = hours + minutes / 60
            startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

            // 时长，默认 30 分钟
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
    // 阶段四：排序并返回
    // ============================================
    /**
     * 按 startHour 升序排序
     * 规则：
     * - 两者都有 startHour：按数值从小到大排序
     * - 只有 a 有 startHour：a 排在前面（返回 -1）
     * - 只有 b 有 startHour：b 排在前面（返回 1）
     * - 都没有 startHour：保持相对顺序（返回 0）
     */
    return schedule.sort((a, b) => {
        if (a.startHour !== undefined && b.startHour !== undefined) return a.startHour - b.startHour
        if (a.startHour !== undefined) return -1
        if (b.startHour !== undefined) return 1
        return 0
    })
}

/**
 * Day 执行项 Composable
 *
 * 提供对执行项构建函数的响应式访问。
 * 在 Vue 3 Composition API 组件中使用，将 buildDayExecutionItems 方法暴露给组件。
 *
 * @returns {Object} 包含 buildDayExecutionItems 函数的对象
 * @returns {Function} returns.buildDayExecutionItems - 构建日执行项数组的纯函数
 *
 * @example
 * // 在 Vue 组件中使用
 * const { buildDayExecutionItems } = useDayExecutionItems()
 * const items = buildDayExecutionItems({ tasks, dailyPlans, habits, habitLogs })
 */
export function useDayExecutionItems() {
    return {
        buildDayExecutionItems
    }
}
