/**
 * @fileoverview Summary 侧边栏 composable
 * 提供侧边栏 tab 配置、日期格式化和标题提取功能。
 */

import type { Ref, ComputedRef } from 'vue'
import type { SummaryKind } from '@/services/db/summaryPeriods'

// 日期部分接口
interface DateParts {
  year: number
  month: number
  day: number
}

// tab 配置接口
interface SummaryTab {
  id: string
  label: string
}

// Summary 数据项接口（用于侧边栏展示）
export interface SummaryItem {
  id?: string | number
  kind?: SummaryKind
  title?: string | null
  period_start?: string
  period_end?: string
  content?: Record<string, string>
  created_at?: string
}

// composable 返回值接口
export interface UseSummarySidebarReturn {
  tabs: SummaryTab[]
  formatDate: (summary: SummaryItem) => string
  getSummaryTitle: (summary: SummaryItem) => string
}

/**
 * 解析日期字符串为年月日部分
 * @param dateString - ISO 日期字符串
 * @returns 日期部分对象，无效日期返回 null
 */
const getDateParts = (dateString: string): DateParts | null => {
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
 * Summary 侧边栏 composable
 * 提供 tab 配置、日期格式化和标题提取功能。
 *
 * @param _activeTabRef - 当前激活 tab 的响应式引用（预留参数）
 * @returns 侧边栏所需的配置和工具方法
 */
export const useSummarySidebar = (_activeTabRef: Ref<string>): UseSummarySidebarReturn => {
  // 侧边栏 tab 列表配置
  const tabs: SummaryTab[] = [
    { id: 'day', label: '日总结' },
    { id: 'week', label: '周总结' },
    { id: 'month', label: '月总结' },
    { id: 'year', label: '年总结' }
  ]

  /**
   * 格式化 summary 的日期显示
   * 根据 kind 类型输出不同格式的日期字符串
   *
   * @param summary - summary 数据对象
   * @returns 格式化后的日期字符串
   */
  const formatDate = (summary: SummaryItem): string => {
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
   * 获取 summary 的显示标题
   * daily 类型优先使用 content.done，其他类型优先使用 title
   *
   * @param summary - summary 数据对象
   * @returns 显示标题字符串
   */
  const getSummaryTitle = (summary: SummaryItem): string => {
    if (summary?.kind === 'daily') {
      return (summary.content?.done as string) || (summary.content?.text as string) || summary.title || '暂无可编辑内容'
    }

    return summary?.title || (summary?.content?.text as string) || '暂无标题'
  }

  return {
    tabs,
    formatDate,
    getSummaryTitle
  }
}
