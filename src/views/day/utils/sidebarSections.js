/**
 * buildSidebarSections
 *
 * 左侧清单和时间轴的职责不同：
 * - 时间轴负责表达时间上的摆放关系
 * - Sidebar 负责快速扫描和定位
 *
 * carry-over 项如果继续逐条平铺，会把当天清单切得很碎。
 * 这里把连续的 carry-over 项收拢成一个 section，让 Sidebar 用折叠组展示。
 *
 * @param {Array} items
 * @returns {Array}
 */
export function buildSidebarSections(items = []) {
  const sections = []
  let carryOverBuffer = []

  const flushCarryOverBuffer = () => {
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
