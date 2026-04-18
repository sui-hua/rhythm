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
 */
import { ref } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 左滑完成任务 Composable
 * @param {Function} onComplete - 完成回调
 */
export function useSwipeToComplete(onComplete) {
    const SWIPE_THRESHOLD = 0.5 // 50% 宽度触发完成
    const MAX_SWIPE = 80 // 最大滑动距离(px)

    const swipeState = ref({
        isSwiping: false,
        offsetX: 0,
        startX: 0
    })

    const handleTouchStart = (e) => {
        swipeState.value.startX = e.touches[0].clientX
        swipeState.value.isSwiping = true
        swipeState.value.offsetX = 0
    }

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
