// 将连续 carry-over 项收拢成折叠组，其余逐条平铺
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
