/**
 * ============================================
 * 任务卡片横向布局样式 (views/day/utils/taskLayoutStyle.ts)
 * ============================================
 *
 * 【模块职责】
 * - 只负责时间轴卡片的横向定位和堆叠语义：
 *   - 普通任务按列平铺
 *   - carry-over 任务保留错层堆叠
 *
 * 【纵向定位说明】
 * - 纵向的 top / height 由各自渲染容器决定：
 *   - TaskItem 使用 CSS 变量 --hour-height
 *   - TaskItemWrapper 使用拖拽时的像素高度
 */

import type { TimelineTask } from './types'

// 返回的 CSS 样式对象：left/width 为定位属性，transform 用于堆叠偏移
interface TaskLayoutStyle {
  zIndex: number
  left?: string
  width?: string
  transform?: string
}

export function buildTaskHorizontalLayoutStyle(task: TimelineTask = {} as TimelineTask): TaskLayoutStyle {
  const col = task._col || 0
  const numCols = task._numCols || 1
  const stackSize = task._stackSize || 1
  const isStackedCarryOver = Boolean(task._isStackedCarryOver) && stackSize > 1

  const style: TaskLayoutStyle = {
    zIndex: col + 10
  }

  // carry-over 堆叠模式：限制最多展示 5 层，逐层偏移
  if (isStackedCarryOver) {
    const visibleStackIndex = Math.min(task._stackIndex || 0, 4)
    const baseOffsetX = visibleStackIndex * 14
    const baseOffsetY = visibleStackIndex * 8

    style.left = numCols > 1
      ? `calc(var(--timeline-left) + ((100% - var(--timeline-left)) / ${numCols}) * ${col})`
      : 'var(--timeline-left)'
    style.width = numCols > 1
      ? `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`
      : 'min(360px, calc(100% - var(--timeline-left) - 12px))'
    style.transform = `translate(${baseOffsetX}px, ${baseOffsetY}px)`
    style.zIndex = 40 + (stackSize - visibleStackIndex)
    return style
  }

  // 普通多列模式：均分宽度，按列号偏移
  if (numCols > 1) {
    style.width = `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`
    style.left = `calc(var(--timeline-left) + ((100% - var(--timeline-left)) / ${numCols}) * ${col})`
  } else {
    style.left = 'var(--timeline-left)'
    style.width = 'calc(100% - var(--timeline-left))'
  }

  return style
}
