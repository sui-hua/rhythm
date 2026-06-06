/**
 * @fileoverview Summary 路由辅助工具
 * 提供 tab id 与 summary kind 之间的双向映射。
 */

import type { SummaryKind } from '@/services/db/summaryPeriods'

// 侧边栏 tab id 类型
export type SummaryTab = 'day' | 'week' | 'month' | 'year'

/**
 * 将侧边栏 tab id 转换为 summary kind
 * 支持 tab id 和 kind 两种输入格式（如 'day' 和 'daily' 都映射到 'daily'）
 *
 * @param tabId - 侧边栏 tab id 或 summary kind
 * @returns 对应的 summary kind
 */
export const summaryTabToKind = (tabId: string): SummaryKind => {
  if (tabId === 'day' || tabId === 'daily') return 'daily'
  if (tabId === 'week' || tabId === 'weekly') return 'weekly'
  if (tabId === 'month' || tabId === 'monthly') return 'monthly'
  if (tabId === 'year' || tabId === 'yearly') return 'yearly'
  return 'daily'
}

/**
 * 将 summary kind 转换为侧边栏 tab id
 *
 * @param kind - summary kind
 * @returns 对应的侧边栏 tab id
 */
export const summaryKindToTab = (kind: string): SummaryTab => {
  if (kind === 'daily') return 'day'
  if (kind === 'weekly') return 'week'
  if (kind === 'monthly') return 'month'
  if (kind === 'yearly') return 'year'
  return 'day'
}
