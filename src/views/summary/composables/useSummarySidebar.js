/**
 * @file useSummarySidebar.js
 * @description 总结侧边栏 Composable - 提供总结模块的标签页管理、日期格式化及标题获取功能
 * 
 * 该模块是 Summary 总结模块的核心业务逻辑层，负责：
 * - 定义日/周/月/年四种总结类型的标签页配置
 * - 格式化总结的时间周期显示
 * - 获取总结的展示标题（支持编辑状态和只读状态）
 * 
 * @module summary/composables/useSummarySidebar
 */

/**
 * 将日期字符串解析为年、月、日部分
 * 
 * @param {string} dateString - ISO 格式的日期字符串
 * @returns {{ year: number, month: number, day: number } | null} 解析成功返回日期对象，失败返回 null
 * 
 * @example
 * getDateParts('2024-03-15')
 * // => { year: 2024, month: 3, day: 15 }
 * 
 * getDateParts('invalid-date')
 * // => null
 */
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

/**
 * 总结侧边栏 Composable
 * 
 * 提供总结模块的核心业务逻辑，包括：
 * - 标签页配置（日/周/月/年四种总结类型）
 * - 日期格式化（根据总结类型返回友好显示格式）
 * - 标题获取（支持 daily 类型的编辑状态标题）
 * 
 * @param {import('vue').Ref<string>} [_activeTabRef] - 可选的活跃标签页引用（当前未使用，预留接口）
 * @returns {{
 *   tabs: Array<{ id: string, label: string }>,
 *   formatDate: function,
 *   getSummaryTitle: function
 * }} 返回侧边栏所需的业务逻辑对象
 * 
 * @example
 * const { tabs, formatDate, getSummaryTitle } = useSummarySidebar()
 * 
 * // tabs: [{ id: 'day', label: '日总结' }, { id: 'week', label: '周总结' }, ...]
 * formatDate({ kind: 'daily', period_start: '2024-03-15' })
 * // => '3月15日'
 * 
 * getSummaryTitle({ kind: 'daily', content: { done: '已完成任务' } })
 * // => '已完成任务'
 */
export const useSummarySidebar = (_activeTabRef) => {
  /**
   * 标签页配置列表
   * @type {Array<{ id: string, label: string }>}
   */
  const tabs = [
    { id: 'day', label: '日总结' },
    { id: 'week', label: '周总结' },
    { id: 'month', label: '月总结' },
    { id: 'year', label: '年总结' }
  ]

  /**
   * 格式化总结的时间周期显示
   * 
   * 根据总结类型（kind）返回友好的人类可读日期格式：
   * - daily: "3月15日"
   * - weekly: "3月15日 - 3月21日"
   * - monthly: "2024年3月"
   * - yearly: "2024年"
   * 
   * @param {Object} summary - 总结对象
   * @param {string} [summary.kind] - 总结类型：'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {string} [summary.period_start] - 周期开始日期（ISO 格式）
   * @param {string} [summary.period_end] - 周期结束日期（ISO 格式，周总结用）
   * @returns {string} 格式化后的日期字符串，无效返回空字符串
   * 
   * @example
   * formatDate({ kind: 'daily', period_start: '2024-03-15' })
   * // => '3月15日'
   * 
   * formatDate({ kind: 'weekly', period_start: '2024-03-15', period_end: '2024-03-21' })
   * // => '3月15日 - 3月21日'
   * 
   * formatDate({ kind: 'monthly', period_start: '2024-03-01' })
   * // => '2024年3月'
   * 
   * formatDate({ kind: 'yearly', period_start: '2024-01-01' })
   * // => '2024年'
   */
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

  /**
   * 获取总结的展示标题
   * 
   * 根据总结类型返回合适的标题：
   * - daily 类型：优先返回已完成的 content.done 内容（表示正在编辑），其次是 content.text，最后是 title
   * - 其他类型：直接返回 title 或 content.text
   * 
   * @param {Object} summary - 总结对象
   * @param {string} [summary.kind] - 总结类型
   * @param {string} [summary.title] - 总结标题
   * @param {Object} [summary.content] - 总结内容对象
   * @param {string} [summary.content.done] - 已完成的内容（编辑中状态）
   * @param {string} [summary.content.text] - 总结正文
   * @returns {string} 总结标题，无内容时返回默认提示文本
   * 
   * @example
   * // 日总结 - 优先显示已完成的编辑内容
   * getSummaryTitle({ kind: 'daily', content: { done: '已完成任务', text: '原始文本' } })
   * // => '已完成任务'
   * 
   * // 日总结 - 无 done 时降级到 text
   * getSummaryTitle({ kind: 'daily', content: { text: '今日总结' } })
   * // => '今日总结'
   * 
   * // 其他类型总结
   * getSummaryTitle({ kind: 'weekly', title: '第12周总结', content: { text: '...' } })
   * // => '第12周总结'
   * 
   * // 无内容时的降级处理
   * getSummaryTitle({ kind: 'daily' })
   * // => '暂无可编辑内容'
   * 
   * getSummaryTitle({ kind: 'weekly' })
   * // => '暂无标题'
   */
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
