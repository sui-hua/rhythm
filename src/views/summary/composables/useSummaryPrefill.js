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
