/**
 * SummarySidebar Composable
 * 提供侧边栏所需的 tabs 配置、日期格式化、标题截取逻辑
 */
export const useSummarySidebar = (activeTabRef) => {
  // 侧边栏 Tab 配置
  const tabs = [
    { id: 'day', label: '日总结' },
    { id: 'week', label: '周总结' },
    { id: 'month', label: '月总结' },
    { id: 'year', label: '年总结' }
  ]

  // 根据总结类型格式化日期显示
  const formatDate = (dateString, type) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (type === 'year') return `${date.getFullYear()}年`
    if (type === 'month') return `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (type === 'week') return `${date.toLocaleDateString()} 周总结`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 获取总结标题，日总结取 done 字段，其他取 content 前 30 字符
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
