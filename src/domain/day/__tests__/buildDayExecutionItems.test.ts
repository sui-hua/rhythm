import { buildDayExecutionItems, splitExecutionItems } from '../buildDayExecutionItems'

describe('buildDayExecutionItems', () => {
  it('builds sorted scheduled items and expanded unscheduled items from three sources', () => {
    const items = buildDayExecutionItems({
      tasks: [
        {
          id: 'task-1',
          title: '处理报销单',
          startAt: null,
          endAt: null,
          notes: '',
          completed: false
        },
        {
          id: 'task-2',
          title: '晨间整理',
          startAt: '2026-04-28T01:00:00.000Z',
          endAt: '2026-04-28T01:30:00.000Z',
          notes: '确认今天安排',
          completed: false
        }
      ],
      dailyPlans: [
        {
          id: 'plan-1',
          title: '产品需求梳理',
          description: '来源：4月产品目标',
          day: '2026-04-28',
          taskTime: '10:30',
          duration: 90,
          status: 0,
          monthlyPlan: {
            id: 'month-1',
            taskTime: null,
            duration: null,
            plan: {
              id: 'goal-1',
              taskTime: null,
              duration: null
            }
          }
        }
      ],
      habits: [
        {
          id: 'habit-1',
          title: '午间散步',
          targetValue: '',
          taskTime: '13:00',
          duration: 20,
          frequency: { type: 'daily' },
          isArchived: false
        },
        {
          id: 'habit-2',
          title: '睡前拉伸',
          targetValue: '',
          taskTime: null,
          duration: null,
          frequency: { type: 'daily' },
          isArchived: false
        }
      ],
      habitLogs: [{ id: 'log-1', habitId: 'habit-1', completedAt: '2026-04-28T05:10:00.000Z' }]
    })

    const { scheduledItems, unscheduledItems } = splitExecutionItems(items)

    expect(scheduledItems.map((item) => item.title)).toEqual(['晨间整理', '产品需求梳理', '午间散步'])
    expect(unscheduledItems.map((item) => item.title)).toEqual(['处理报销单', '睡前拉伸'])
    expect(scheduledItems[0]).toMatchObject({
      source: 'task',
      categoryLabel: '个人任务',
      startMinutes: 60,
      durationMinutes: 30,
      readonly: false
    })
    expect(scheduledItems[1]).toMatchObject({
      source: 'daily_plan',
      categoryLabel: '今日计划',
      startMinutes: 630,
      durationMinutes: 90,
      readonly: true
    })
    expect(scheduledItems[2]).toMatchObject({
      source: 'habit',
      categoryLabel: '日常习惯',
      completed: true,
      readonly: true
    })
  })
})