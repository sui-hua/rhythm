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

const SWIPE_THRESHOLD = 0.5
const MAX_SWIPE = 80
const REFERENCE_WIDTH = 280

export function useSwipeToComplete(onComplete) {
    const swipeState = ref({
        isSwiping: false,
        offsetX: 0,
        startX: 0,
        activeId: null
    })

    const handleTouchStart = (e, id = null) => {
        swipeState.value = {
            startX: e.touches[0].clientX,
            isSwiping: true,
            offsetX: 0,
            activeId: id
        }
    }

    const handleTouchMove = (e, id = null) => {
        if (!swipeState.value.isSwiping) return
        if (id !== null && swipeState.value.activeId !== id) return

        const currentX = e.touches[0].clientX
        let deltaX = swipeState.value.startX - currentX

        if (deltaX < 0) {
            deltaX = 0
        } else {
            deltaX = Math.min(deltaX, MAX_SWIPE)
        }

        swipeState.value.offsetX = deltaX
    }

    const handleTouchEnd = async (id = null) => {
        if (!swipeState.value.isSwiping) return
        if (id !== null && swipeState.value.activeId !== id) return

        const { offsetX, activeId } = swipeState.value
        const ratio = offsetX / REFERENCE_WIDTH

        swipeState.value.isSwiping = false
        swipeState.value.activeId = null

        if (ratio >= SWIPE_THRESHOLD) {
            if ('vibrate' in navigator) {
                navigator.vibrate(50)
            }
            playSuccessSound()
            if (onComplete) {
                await onComplete(activeId)
            }
        }

        setTimeout(() => {
            swipeState.value.offsetX = 0
        }, 300)
    }

    const getOffset = (id = null) => {
        if (id !== null && swipeState.value.activeId !== id) return 0
        return swipeState.value.offsetX
    }

    return {
        swipeState,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        getOffset
    }
}
