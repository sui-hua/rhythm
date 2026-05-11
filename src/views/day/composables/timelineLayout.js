/**
 * buildTimelineDisplaySchedule
 *
 * 负责给时间轴项目注入布局元数据：
 * - 普通任务继续沿用原来的横向分栏算法
 * - carry-over 项不再被横向摊开，而是压成同一列中的错层堆叠
 *
 * 这里刻意把算法抽成纯函数，避免布局规则散落在组件里，
 * 后续无论是单测还是继续调整堆叠策略，都不需要先 mount 整个时间轴。
 *
 * @param {Array} items
 * @returns {Array}
 */
export function buildTimelineDisplaySchedule(items = []) {
  const tasks = items
    .map((task, index) => ({ ...task, _originalIndex: index }))
    .filter(task => task.startHour !== undefined)

  tasks.sort((a, b) => a.startHour - b.startHour || (b.durationHours || 1) - (a.durationHours || 1))

  let cluster = []
  let clusterEnding = null

  for (const task of tasks) {
    const taskEnd = task.startHour + (task.durationHours || 1)

    if (clusterEnding !== null && task.startHour >= clusterEnding) {
      applyClusterLayout(cluster)
      cluster = []
      clusterEnding = null
    }

    cluster.push(task)
    clusterEnding = clusterEnding === null ? taskEnd : Math.max(clusterEnding, taskEnd)
  }

  if (cluster.length > 0) {
    applyClusterLayout(cluster)
  }

  return tasks
}

/**
 * applyClusterLayout
 *
 * cluster 代表一个时间上互相有重叠关系的区间。
 * 在这个区间里：
 * - regular tasks 继续做贪心分栏
 * - carry-over tasks 收拢成一个 stack lane
 *
 * 这样既能保留普通任务的原有并排关系，
 * 也能让“历史积压的一堆”被视觉上识别成同一摞内容。
 *
 * @param {Array} cluster
 */
function applyClusterLayout(cluster) {
  const regularTasks = cluster.filter(task => !task.isCarryOver)
  const carryOverTasks = cluster.filter(task => task.isCarryOver)
  const regularColumns = buildRegularColumns(regularTasks)
  const hasCarryOverStack = carryOverTasks.length > 0
  const totalCols = regularColumns.length + (hasCarryOverStack ? 1 : 0)

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

  const stackColumnIndex = regularColumns.length

  carryOverTasks.forEach((task, stackIndex) => {
    task._col = stackColumnIndex
    task._numCols = totalCols || 1
    task._isStackedCarryOver = true
    task._stackIndex = stackIndex
    task._stackSize = carryOverTasks.length
  })
}

/**
 * buildRegularColumns
 *
 * 普通任务沿用既有贪心列分配：
 * 每列内部保证前一项结束后，后一项才会进入该列。
 *
 * @param {Array} tasks
 * @returns {Array<Array>}
 */
function buildRegularColumns(tasks) {
  const columns = []

  for (const task of tasks) {
    let placed = false

    for (const column of columns) {
      const lastInColumn = column[column.length - 1]
      const lastEnd = lastInColumn.startHour + (lastInColumn.durationHours || 1)

      if (lastEnd <= task.startHour) {
        column.push(task)
        placed = true
        break
      }
    }

    if (!placed) {
      columns.push([task])
    }
  }

  return columns
}
