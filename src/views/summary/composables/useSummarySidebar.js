export const useSummarySidebar = (activeTabRef) => {
  const tabs = [
    { id: 'day', label: '日总结' },
    { id: 'week', label: '周总结' },
    { id: 'month', label: '月总结' },
    { id: 'year', label: '年总结' }
  ]

  const formatDate = (dateString, type) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (type === 'year') return `${date.getFullYear()}年`
    if (type === 'month') return `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (type === 'week') return `${date.toLocaleDateString()} 周总结`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getSummaryTitle = (summary) => {
    if (activeTabRef.value === 'day') {
      return summary.content.done || '暂无可编辑内容'
    }
    return summary.content.substring(0, 30) + (summary.content.length > 30 ? '...' : '')
  }

  return {
    tabs,
    formatDate,
    getSummaryTitle
  }
}
