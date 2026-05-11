import { describe, expect, it } from 'vitest'
import { buildSidebarSections } from '@/views/day/composables/sidebarSections'

describe('buildSidebarSections', () => {
  it('groups carry-over items into a dedicated collapsible section', () => {
    const sections = buildSidebarSections([
      { title: '当天任务', isCarryOver: false },
      { title: '补做 1', isCarryOver: true, carryOverLabel: '原计划 5月4日' },
      { title: '补做 2', isCarryOver: true, carryOverLabel: '原计划 5月5日' },
      { title: '当天任务 2', isCarryOver: false }
    ])

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
    expect(sections[1].items.map(item => item.title)).toEqual(['补做 1', '补做 2'])
    expect(sections[2]).toMatchObject({
      type: 'item',
      item: { title: '当天任务 2' }
    })
  })
})
