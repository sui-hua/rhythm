import { describe, expect, it } from 'vitest'
import { buildSidebarSections } from '@/views/day/utils/sidebarSections'
import type { SidebarItem, SidebarSection } from '@/views/day/utils/types'

describe('buildSidebarSections', () => {
  it('groups carry-over items into a dedicated collapsible section', () => {
    const items: SidebarItem[] = [
      { title: '当天任务', isCarryOver: false },
      { title: '补做 1', isCarryOver: true, carryOverLabel: '原计划 5月4日' },
      { title: '补做 2', isCarryOver: true, carryOverLabel: '原计划 5月5日' },
      { title: '当天任务 2', isCarryOver: false }
    ]

    const sections: SidebarSection[] = buildSidebarSections(items)

    expect(sections).toHaveLength(3)
    expect(sections[0]).toMatchObject({
      type: 'item',
      item: { title: '当天任务' }
    })
    expect(sections[1]).toMatchObject({
      type: 'carry-over-group',
      label: '延后项',
      count: 2
    })
    // carry-over-group 类型包含 items 数组
    if (sections[1].type === 'carry-over-group') {
      expect(sections[1].items.map((item: SidebarItem) => item.title)).toEqual(['补做 1', '补做 2'])
    }
    expect(sections[2]).toMatchObject({
      type: 'item',
      item: { title: '当天任务 2' }
    })
  })
})
