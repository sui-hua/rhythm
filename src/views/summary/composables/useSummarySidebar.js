const getDateParts = (dateString) => {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  }
}

export const useSummarySidebar = (_activeTabRef) => {
  const tabs = [
    { id: 'day', label: '日总结' },
    { id: 'week', label: '周总结' },
    { id: 'month', label: '月总结' },
    { id: 'year', label: '年总结' }
  ]

  const formatDate = (summary) => {
    if (!summary?.period_start) return ''

    const start = getDateParts(summary.period_start)
    const end = getDateParts(summary.period_end ?? summary.period_start)

    if (!start) return ''
    if (summary.kind === 'yearly') return `${start.year}年`
    if (summary.kind === 'monthly') return `${start.year}年${start.month}月`
    if (summary.kind === 'weekly' && end) {
      return `${start.month}月${start.day}日 - ${end.month}月${end.day}日`
    }

    return `${start.month}月${start.day}日`
  }

  const getSummaryTitle = (summary) => {
    if (summary?.kind === 'daily') {
      return summary.content?.done || summary.content?.text || summary.title || '暂无可编辑内容'
    }

    return summary?.title || summary?.content?.text || '暂无标题'
  }

  return {
    tabs,
    formatDate,
    getSummaryTitle
  }
}
