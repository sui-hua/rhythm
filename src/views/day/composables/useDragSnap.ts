/**
 * useDragSnap - 拖拽吸附逻辑
 *
 * 提供像素<->时间转换和边界约束计算。
 * 所有函数为纯函数，不依赖 Vue 响应式系统。
 *
 * 常量：
 *   HOUR_HEIGHT = 180px（对应 CSS max(25vh, 180px) 中的最小值）
 *   SNAP_MINUTES = 5
 *   SNAP_PX = 15px（5 分钟对应的像素值）
 */

export const HOUR_HEIGHT = 180
export const SNAP_MINUTES = 5
export const SNAP_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT // 15px

/** 拖拽/缩放计算的输入任务快照 */
export interface DragTaskInput {
    startHour: number
    durationHours: number
}

/** 拖拽/缩放计算结果 */
export interface DragResult {
    newStart: number
    newEnd: number
}

/**
 * 像素 -> 小时（浮点数），snap 到 5 分钟粒度
 * @param px - 像素偏移量
 * @returns 对齐后的小时数
 */
export function pxToHour(px: number): number {
    const rawHours = px / HOUR_HEIGHT
    const snapIntervals = Math.round(rawHours * (60 / SNAP_MINUTES))
    return snapIntervals * (SNAP_MINUTES / 60)
}

/**
 * 小时 -> 像素
 * @param hour - 小时数（浮点数）
 * @returns 像素值
 */
export function hourToPx(hour: number): number {
    return hour * HOUR_HEIGHT
}

/**
 * 拖拽移动：计算新的开始/结束时间，保持 duration 不变
 * @param task - 任务对象，需有 startHour 和 durationHours
 * @param deltaY - 垂直拖拽像素偏移量（正=向下，负=向上）
 */
export function calcDragResult(task: DragTaskInput, deltaY: number): DragResult {
    const deltaHours = pxToHour(deltaY)
    const maxStart = Math.max(0, 24 - task.durationHours)
    const newStart = Math.max(0, Math.min(maxStart, task.startHour + deltaHours))
    return { newStart, newEnd: newStart + task.durationHours }
}

/**
 * 缩放：计算新的结束时间，保持 startHour 不变
 * @param task - 任务对象，需有 startHour 和 durationHours
 * @param newHeight - 缩放后的高度（像素）
 */
export function calcResizeResult(task: DragTaskInput, newHeight: number): DragResult {
    const minDuration = SNAP_MINUTES / 60 // 0.25h = 5min
    const maxDuration = 24 - task.startHour
    const newDuration = Math.max(minDuration, Math.min(maxDuration, pxToHour(newHeight)))
    return { newStart: task.startHour, newEnd: task.startHour + newDuration }
}
