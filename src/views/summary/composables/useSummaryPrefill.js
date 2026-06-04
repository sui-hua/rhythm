import { db } from '@/services/database'

/**
 * 获取今日数据概览，用于总结模块展示任务完成率和习惯打卡统计
 * @returns {Promise<Object>} 今日数据概览对象
 */
export async function fetchTodayDataOverview() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  const [tasks, habitLogs] = await Promise.all([
    db.task.list(startOfDay, endOfDay),
    db.habit.listLogsByDate(startOfDay, endOfDay)
  ])

  const completedTasks = (tasks || []).filter(t => t.completed)
  const totalTasks = (tasks || []).length

  return {
    completedTaskCount: completedTasks.length,
    totalTaskCount: totalTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
    habitLogCount: (habitLogs || []).length,
    completedTaskTitles: completedTasks.map(t => t.title)
  }
}

/**
 * 根据任务、习惯和方向计划数据构建每日总结预填内容
 * @param {Object} params - 包含 tasks、habits、directionItems 的数据对象
 * @returns {Object} 预填的总结表单数据
 */
export function buildDailySummaryPrefill({ tasks = [], habits = [], directionItems = [] }) {
  const doneLines = [
    ...tasks.filter((item) => item.completed).map((item) => item.title),
    ...habits.filter((item) => item.completed).map((item) => item.title)
  ]

  const tomorrowLines = directionItems.map((item) => {
    const title = item.sourceMeta?.planTitle ? `${item.sourceMeta.planTitle}：${item.title}` : item.title
    return `继续推进 ${title}`
  })

  return {
    done: doneLines.join('\n'),
    improve: '',
    tomorrow: tomorrowLines.join('\n')
  }
}
