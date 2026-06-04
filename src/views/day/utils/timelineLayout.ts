/**
 * 时间轴布局计算
 *
 * 根据任务的时间区间计算多列布局，处理时间重叠：
 * - 普通任务使用贪心分栏算法，尽可能复用已有列
 * - carry-over 任务收拢到同一列堆叠展示
 */

import type { DailyScheduleItem } from '@/types/models'
import type { TimelineTask } from './types'

/**
 * 计算时间轴任务的显示布局
 * @param items - 待排布的原始日程列表（不含布局属性）
 * @returns 排布后的任务列表（附加 _col/_numCols 等布局属性）
 */
export function buildTimelineDisplaySchedule(items: DailyScheduleItem[] = []): TimelineTask[] {
  // 记录原始索引用于后续排序稳定；过滤掉没有 startHour 的条目
  // 类型断言：filter 确保 startHour 非空，后续所有 startHour 访问均安全
  const tasks = items
    .map((task, index) => ({ ...task, _originalIndex: index } as TimelineTask))
    .filter(task => task.startHour !== undefined)

  // 按开始时间升序，相同开始时间则长时任务优先排在前面
  tasks.sort((a, b) => a.startHour! - b.startHour! || (b.durationHours || 1) - (a.durationHours || 1))

  let cluster: TimelineTask[] = []
  let clusterEnding: number | null = null

  for (const task of tasks) {
    const taskEnd = task.startHour! + (task.durationHours || 1)

    // 当前任务与簇不重叠，结算上一个簇后再开始新簇
    if (clusterEnding !== null && task.startHour! >= clusterEnding) {
      applyClusterLayout(cluster)
      cluster = []
      clusterEnding = null
    }

    cluster.push(task)
    clusterEnding = clusterEnding === null ? taskEnd : Math.max(clusterEnding, taskEnd)
  }

  // 结算最后一个簇
  if (cluster.length > 0) {
    applyClusterLayout(cluster)
  }

  return tasks
}

// 对一个时间重叠簇应用布局：普通任务贪心分栏，carry-over 任务收拢堆叠
function applyClusterLayout(cluster: TimelineTask[]): void {
  const regularTasks = cluster.filter(task => !task.isCarryOver)
  const carryOverTasks = cluster.filter(task => task.isCarryOver)
  const regularColumns = buildRegularColumns(regularTasks)
  const hasCarryOverStack = carryOverTasks.length > 0
  // 总列数 = 普通任务列数 + carry-over 占用的一列
  const totalCols = regularColumns.length + (hasCarryOverStack ? 1 : 0)

  // 为普通任务分配列号
  regularColumns.forEach((column, columnIndex) => {
    column.forEach(task => {
      task._col = columnIndex
      task._numCols = totalCols
      task._isStackedCarryOver = false
    })
  })

  if (!hasCarryOverStack) {
    return
  }

  // carry-over 任务共享最后一列，按顺序堆叠
  const stackColumnIndex = regularColumns.length

  carryOverTasks.forEach((task, stackIndex) => {
    task._col = stackColumnIndex
    task._numCols = totalCols || 1
    task._isStackedCarryOver = true
    task._stackIndex = stackIndex
    task._stackSize = carryOverTasks.length
  })
}

// 贪心分栏：遍历任务，放入第一个不重叠的列，否则新建列
function buildRegularColumns(tasks: TimelineTask[]): TimelineTask[][] {
  const columns: TimelineTask[][] = []

  for (const task of tasks) {
    let placed = false

    for (const column of columns) {
      const lastInColumn = column[column.length - 1]!
      const lastEnd = lastInColumn.startHour! + (lastInColumn.durationHours || 1)

      // 当前列末尾任务结束时间 <= 新任务开始时间，说明不重叠，可复用此列
      if (lastEnd <= task.startHour!) {
        column.push(task)
        placed = true
        break
      }
    }

    // 所有列都与当前任务重叠，新建一列
    if (!placed) {
      columns.push([task])
    }
  }

  return columns
}
