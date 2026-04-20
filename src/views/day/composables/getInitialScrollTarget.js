/**
 * @fileoverview getInitialScrollTarget.js
 * 
 * 提供日视图时间轴的初始滚动位置计算逻辑。
 * 
 * 在日视图初始化时，需要确定时间轴应该滚动到哪个位置显示。
 * 本模块根据任务完成状态、目标日期是否为今天、以及当前时间与任务的关联性，
 * 综合计算最优的初始滚动目标，确保用户打开视图时能看到最相关的内容。
 * 
 * @module views/day/composables/getInitialScrollTarget
 */

/**
 * 默认滚动到的小时数。
 * 当日程为空或无法确定有效目标时，时间轴将滚动到上午 8:00。
 * @constant {number}
 */
const DEFAULT_HOUR = 8

/**
 * 任务过期阈值（小时）。
 * 如果当前时间已经超过任务结束时间达到此阈值，任务被视为"过期"，
 * 滚动目标将切换到当前时间位置而非任务位置。
 * @constant {number}
 */
const STALE_TASK_THRESHOLD_HOURS = 2

/**
 * 判断两个日期是否为同一天。
 * 通过比较年、月、日三个维度确定，不涉及时区问题。
 * 
 * @param {Date} a - 第一个日期对象
 * @param {Date} b - 第二个日期对象
 * @returns {boolean} 同一天返回 true，否则返回 false
 */
const isSameDay = (a, b) => {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/**
 * 计算日视图时间轴的初始滚动目标位置。
 * 
 * 根据日程安排、目标日期和当前时间，综合判断时间轴打开时应滚动到哪个位置。
 * 优先显示当前最需要关注的任务或时间点：
 * 1. 空日程 → 回退到默认小时（8:00）
 * 2. 非今日视图 → 定位到第一个未完成任务或第一个任务
 * 3. 今日视图且当前时间已超过任务结束时间2小时以上 → 滚动到当前时间
 * 4. 今日视图且任务未过期 → 定位到目标任务
 * 
 * @param {Object} params - 函数参数
 * @param {Array<Object>} [params.schedule=[]] - 日程任务列表，每个任务应包含 startHour、durationHours、completed 等属性
 * @param {Date} [params.targetDate] - 目标日期，用于判断是否为"今天"
 * @param {Date} [params.now=new Date()] - 当前时间，默认为此刻
 * @returns {Object} 滚动目标对象，包含 type 和相关属性：
 *   - type: 'default-hour' | 'task' | 'current-time'
 *   - hour: 当 type 为 'default-hour' 或 'current-time' 时的目标小时
 *   - index: 当 type 为 'task' 时的任务在 schedule 中的索引
 */
export const getInitialScrollTarget = ({
  schedule = [],
  targetDate,
  now = new Date()
} = {}) => {
  if (!schedule.length) {
    return {
      type: 'default-hour',
      hour: DEFAULT_HOUR
    }
  }

  const firstUncompletedIndex = schedule.findIndex(task => !task.completed)
  const targetIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0
  const targetTask = schedule[targetIndex]

  if (!targetDate || !isSameDay(targetDate, now)) {
    return {
      type: 'task',
      index: targetIndex
    }
  }

  const currentHour = now.getHours() + now.getMinutes() / 60
  const taskEndHour = (targetTask.startHour ?? 0) + (targetTask.durationHours || 0)

  if (currentHour - taskEndHour >= STALE_TASK_THRESHOLD_HOURS) {
    return {
      type: 'current-time',
      hour: Math.floor(currentHour)
    }
  }

  return {
    type: 'task',
    index: targetIndex
  }
}

