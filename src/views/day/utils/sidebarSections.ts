/**
 * ============================================
 * 侧边栏区段构建 (views/day/utils/sidebarSections.ts)
 * ============================================
 *
 * 【模块职责】
 * - 将连续 carry-over 项收拢成折叠组，其余逐条平铺
 * - 返回区段列表供侧边栏渲染
 */

import type { SidebarItem, SidebarSection } from './types'

// 将连续 carry-over 项收拢成折叠组，其余逐条平铺
export function buildSidebarSections(items: SidebarItem[] = []): SidebarSection[] {
  const sections: SidebarSection[] = []
  let carryOverBuffer: SidebarItem[] = []

  // 将缓冲区中的 carry-over 项作为一个折叠组输出
  const flushCarryOverBuffer = (): void => {
    if (carryOverBuffer.length === 0) return

    sections.push({
      type: 'carry-over-group',
      label: '延后项',
      count: carryOverBuffer.length,
      items: carryOverBuffer
    })

    carryOverBuffer = []
  }

  for (const item of items) {
    if (item.isCarryOver) {
      carryOverBuffer.push(item)
      continue
    }

    flushCarryOverBuffer()
    sections.push({
      type: 'item',
      item
    })
  }

  flushCarryOverBuffer()

  return sections
}
