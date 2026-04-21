import { validateTaskForm } from '../taskForm'

describe('validateTaskForm', () => {
  it('rejects end time earlier than start time', () => {
    expect(() =>
      validateTaskForm({
        title: '深度工作',
        startAt: '2026-04-21T10:00:00.000Z',
        endAt: '2026-04-21T09:00:00.000Z',
        notes: ''
      })
    ).toThrow('结束时间必须晚于开始时间')
  })
})
