import { describe, expect, it } from 'vitest'
import { partitionInboxTasks } from '@/views/day/composables/useInboxTasks'

describe('useInboxTasks helpers', () => {
  it('splits inbox tasks from scheduled tasks', () => {
    const result = partitionInboxTasks([
      { id: 't1', title: '待安排事项', start_time: null, status: 'inbox' },
      { id: 't2', title: '已安排事项', start_time: '2026-04-20T09:00:00.000Z', status: 'scheduled' }
    ])

    expect(result.inbox.map((item) => item.id)).toEqual(['t1'])
    expect(result.scheduled.map((item) => item.id)).toEqual(['t2'])
  })

  it('classifies tasks without start_time as inbox', () => {
    const result = partitionInboxTasks([
      { id: 't1', title: '无时间任务', start_time: null, status: 'pending' },
      { id: 't2', title: '有时但inbox', start_time: '2026-04-20T09:00:00.000Z', status: 'inbox' }
    ])

    expect(result.inbox.map((item) => item.id)).toEqual(['t1', 't2'])
    expect(result.scheduled).toHaveLength(0)
  })
})
