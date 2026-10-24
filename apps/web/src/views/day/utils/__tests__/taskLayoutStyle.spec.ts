import { describe, expect, it } from 'vitest'
import { buildTaskHorizontalLayoutStyle } from '@/views/day/utils/taskLayoutStyle'
import type { TimelineTask } from '@/views/day/utils/types'

describe('buildTaskHorizontalLayoutStyle', () => {
  it('keeps stacked carry-over tasks on the compact stacked lane', () => {
    const task: TimelineTask = {
      startHour: 0,
      _col: 0,
      _numCols: 1,
      _isStackedCarryOver: true,
      _stackIndex: 2,
      _stackSize: 4
    }
    const style = buildTaskHorizontalLayoutStyle(task)

    expect(style.left).toBe('var(--timeline-left)')
    expect(style.width).toBe('min(360px, calc(100% - var(--timeline-left) - 12px))')
    expect(style.transform).toBe('translate(28px, 16px)')
    expect(style.zIndex).toBe(42)
  })

  it('keeps regular single-column tasks full width', () => {
    const task: TimelineTask = {
      startHour: 0,
      _col: 0,
      _numCols: 1,
      _isStackedCarryOver: false
    }
    const style = buildTaskHorizontalLayoutStyle(task)

    expect(style.left).toBe('var(--timeline-left)')
    expect(style.width).toBe('calc(100% - var(--timeline-left))')
    expect(style.transform).toBeUndefined()
    expect(style.zIndex).toBe(10)
  })

  it('renders a single carry-over item as full width instead of compact stack width', () => {
    const task: TimelineTask = {
      startHour: 0,
      _col: 0,
      _numCols: 1,
      _isStackedCarryOver: true,
      _stackIndex: 0,
      _stackSize: 1
    }
    const style = buildTaskHorizontalLayoutStyle(task)

    expect(style.left).toBe('var(--timeline-left)')
    expect(style.width).toBe('calc(100% - var(--timeline-left))')
    expect(style.transform).toBeUndefined()
    expect(style.zIndex).toBe(10)
  })
})
