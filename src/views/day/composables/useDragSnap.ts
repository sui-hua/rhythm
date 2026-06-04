/**
 * useDragSnap - 拖拽吸附工具函数
 *
 * 使用场景：时间轴任务拖拽移动和底部边缘缩放
 * 数据流：纯函数，输入像素/时间 → 输出对齐后的时间值
 *
 * 所有函数为纯函数，不依赖 Vue 响应式系统，可安全在任何上下文调用
 */

// 小时对应的高度像素值，与 CSS max(25vh, 180px) 中的最小值保持一致
export const HOUR_HEIGHT = 180
// 吸附粒度：5 分钟
export const SNAP_MINUTES = 5
// 5 分钟对应的像素值（15px）
export const SNAP_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT

/** 拖拽/缩放计算的输入任务快照 */
export interface DragTaskInput {
    startHour?: number
    durationHours?: number
}

/** 拖拽/缩放计算结果 */
export interface DragResult {
    newStart: number
    newEnd: number
}

/**
 * 像素转换为小时数（浮点数），snap 到 5 分钟粒度
 * 使用 Math.round 确保四舍五入到最近的吸附点
 */
export function pxToHour(px: number): number {
    const rawHours = px / HOUR_HEIGHT
    const snapIntervals = Math.round(rawHours * (60 / SNAP_MINUTES))
    return snapIntervals * (SNAP_MINUTES / 60)
}

/**
 * 小时数转换为像素值
 * 用于计算任务元素的 top/height 定位
 */
export function hourToPx(hour: number): number {
    return hour * HOUR_HEIGHT
}

/**
 * 拖拽移动计算
 * 保持任务时长不变，计算新的开始/结束时间
 * 边界约束：不允许超出 0-24 小时范围
 */
export function calcDragResult(task: DragTaskInput, deltaY: number): DragResult {
    const deltaHours = pxToHour(deltaY)
    const duration = task.durationHours ?? 1
    const start = task.startHour ?? 0
    // 最大起始时间 = 24h - 任务时长，防止任务溢出到次日
    const maxStart = Math.max(0, 24 - duration)
    const newStart = Math.max(0, Math.min(maxStart, start + deltaHours))
    return { newStart, newEnd: newStart + duration }
}

/**
 * 缩放计算
 * 保持起始时间不变，根据新高度计算结束时间
 * 最小持续时间 5 分钟，最大不超过 24h 减去起始时间
 */
export function calcResizeResult(task: DragTaskInput, newHeight: number): DragResult {
    const start = task.startHour ?? 0
    // 最小 5 分钟，避免任务被缩放到不可见
    const minDuration = SNAP_MINUTES / 60
    const maxDuration = 24 - start
    const newDuration = Math.max(minDuration, Math.min(maxDuration, pxToHour(newHeight)))
    return { newStart: start, newEnd: start + newDuration }
}
