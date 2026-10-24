import { groupTasksForDay } from '../taskGroups'

describe('groupTasksForDay', () => {
  it('splits scheduled and unscheduled tasks', () => {
    const groups = groupTasksForDay([
      {
        id: '1',
        title: 'A',
        startAt: '2026-04-21T09:00:00.000Z',
        endAt: '2026-04-21T10:00:00.000Z',
        completed: false,
        notes: ''
      },
      {
        id: '2',
        title: 'B',
        startAt: null,
        endAt: null,
        completed: false,
        notes: ''
      }
    ])

    expect(groups.scheduled).toHaveLength(1)
    expect(groups.unscheduled).toHaveLength(1)
  })
})
