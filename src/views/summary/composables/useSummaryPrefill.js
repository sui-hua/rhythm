/**
 * Builds prefill content for daily summary from execution data.
 * @param {Object} params - { tasks, habits, directionItems }
 * @param {Array} params.tasks - Completed tasks array
 * @param {Array} params.habits - Completed habits array
 * @param {Array} params.directionItems - Direction items array
 * @returns {{ done: string, improve: string, tomorrow: string }}
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
