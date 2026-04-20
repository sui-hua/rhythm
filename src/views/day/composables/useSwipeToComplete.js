/**
 * ============================================
 * 左滑完成任务 (views/day/composables/useSwipeToComplete.js)
 * ============================================
 *
 * 【模块职责】
 * - 实现移动端左滑任务卡片完成操作
 * - 支持触摸事件处理
 * - 完成后触发震动反馈和音效
 *
 * 【滑动逻辑】
 * - 只响应左滑操作（deltaX > 0）
 * - 最大滑动距离 80px
 * - 超过 50% 宽度阈值触发完成
 *
 * 【完成反馈】
 * - 震动反馈 navigator.vibrate(50)
 * - 成功音效 playSuccessSound()
 *
 * @description
 * 移动端任务卡片左滑完成交互的 Composable，提供完整的触摸事件处理流程：
 * 1. handleTouchStart - 记录触摸起始位置
 * 2. handleTouchMove - 实时计算滑动距离，限制最大滑动距离
 * 3. handleTouchEnd - 判断是否达到完成阈值，触发完成回调
 *
 * @module day/composables
 * @requires vue
 * @requires @/utils/audio
 */

import { ref } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 左滑完成任务 Composable
 *
 * 提供移动端左滑手势识别和任务完成处理能力。通过监听触摸事件，
 * 计算滑动距离并判断是否达到完成阈值，触发相应的回调和反馈。
 *
 * @param {Function} onComplete - 滑动完成达到阈值时触发的回调函数
 * @param {Promise<void>} [onComplete] - 回调可为异步函数
 *
 * @returns {Object} 返回状态和方法对象
 * @returns {Ref<SwipeState>} returns.swipeState - 滑动状态（isSwiping/offserX/startX）
 * @returns {Function} returns.handleTouchStart - 触摸开始事件处理（e: TouchEvent）
 * @returns {Function} returns.handleTouchMove - 触摸移动事件处理（e: TouchEvent）
 * @returns {Function} returns.handleTouchEnd - 触摸结束事件处理（异步）
 * @returns {Function} returns.resetSwipe - 强制重置滑动状态
 *
 * @example
 * const { swipeState, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToComplete(async () => {
 *   await completeTask(taskId)
 * })
 */
export function useSwipeToComplete(onComplete) {
    const SWIPE_THRESHOLD = 0.5 // 50% 宽度触发完成
    const MAX_SWIPE = 80 // 最大滑动距离(px)

    const swipeState = ref({
        isSwiping: false,
        offsetX: 0,
        startX: 0
    })

    /**
     * 触摸开始事件处理
     * 记录触摸起始位置，初始化滑动状态
     * @param {TouchEvent} e - 触摸事件对象
     */
    const handleTouchStart = (e) => {
        swipeState.value.startX = e.touches[0].clientX
        swipeState.value.isSwiping = true
        swipeState.value.offsetX = 0
    }

    /**
     * 触摸移动事件处理
     * 实时计算滑动距离，只响应左滑（deltaX > 0），限制最大滑动距离
     * @param {TouchEvent} e - 触摸事件对象
     */
    const handleTouchMove = (e) => {
        if (!swipeState.value.isSwiping) return

        const currentX = e.touches[0].clientX
        let deltaX = swipeState.value.startX - currentX

        // 只响应左滑（deltaX > 0）
        if (deltaX < 0) {
            deltaX = 0
        } else {
            // 限制最大滑动距离
            deltaX = Math.min(deltaX, MAX_SWIPE)
        }

        swipeState.value.offsetX = deltaX
    }

    /**
     * 触摸结束事件处理
     * 判断滑动距离是否达到完成阈值，触发完成反馈和回调
     * @returns {Promise<void>}
     */
    const handleTouchEnd = async () => {
        if (!swipeState.value.isSwiping) return

        const { offsetX, startX } = swipeState.value
        const elementWidth = 280 // 预估侧边栏宽度
        const ratio = offsetX / elementWidth

        swipeState.value.isSwiping = false

        // 超过阈值，触发完成
        if (ratio >= SWIPE_THRESHOLD) {
            // 震动反馈
            if ('vibrate' in navigator) {
                navigator.vibrate(50)
            }

            // 播放成功音效
            playSuccessSound()

            // 执行完成回调
            if (onComplete) {
                await onComplete()
            }
        }

        // 重置状态
        setTimeout(() => {
            swipeState.value.offsetX = 0
        }, 300)
    }

    /**
     * 重置滑动状态
     * 强制将滑动距离和状态归零，通常用于外部中断
     */
    const resetSwipe = () => {
        swipeState.value.offsetX = 0
        swipeState.value.isSwiping = false
    }

    return {
        swipeState,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetSwipe
    }
}
