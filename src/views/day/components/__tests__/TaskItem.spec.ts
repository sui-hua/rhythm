// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import TaskItem from '@/views/day/components/TaskItem.vue'
import type { DailyScheduleItem } from '@/types/models'

vi.mock('@/stores/dayStore', () => ({
  useDayStore: () => ({
    handleStartTask: vi.fn()
  })
}))

vi.mock('@/stores/pomodoroStore', () => ({
  usePomodoroStore: () => ({
    activeTask: null,
    formattedTime: '00:00',
    elapsedSeconds: 0,
    setActiveTask: vi.fn(),
    openModal: vi.fn()
  })
}))

// 读取 TaskItem 组件源码用于静态分析
const taskItemSource: string = readFileSync(resolve(process.cwd(), 'src/views/day/components/TaskItem.vue'), 'utf-8')

function createTask(overrides: Partial<DailyScheduleItem> = {}): DailyScheduleItem {
  return {
    id: 'task-1',
    type: 'task',
    title: '写周报',
    time: '09:00',
    duration: '30分钟',
    rawDuration: 0.5,
    durationHours: 0.5,
    startHour: 9,
    category: '工作',
    description: '',
    completed: false,
    ...overrides
  } as DailyScheduleItem
}

describe('TaskItem short-duration layout', () => {
  it('does not force extra minimum height on ultra-short timeline items', () => {
    expect(taskItemSource).not.toContain("minHeight: '28px'")
    expect(taskItemSource).not.toContain("min-h-[24px]")
  })
})

describe('TaskItem edit event', () => {
  it('emits task id when double-clicking a timeline task', async () => {
    const wrapper = mount(TaskItem, {
      props: {
        task: createTask({ id: 'task-edit-id' }),
        index: 3,
        embedded: true
      },
      global: {
        stubs: {
          Badge: { template: '<span><slot /></span>' },
          Button: { template: '<button><slot /></button>' }
        }
      }
    })

    await wrapper.find('[id="task-3"]').trigger('dblclick')

    expect(wrapper.emitted('edit')).toEqual([['task-edit-id']])
  })
})

