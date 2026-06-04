import { computed, ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { HOUR_HEIGHT, calcDragResult, calcResizeResult } from '@/views/day/composables/useDragSnap'
import type { DragTaskInput } from '@/views/day/composables/useDragSnap'

/** 拖拽模式：idle=空闲 | drag=整体移动 | resize=底部缩放 */
type DragMode = 'idle' | 'drag' | 'resize'

/** 拖拽提交时传递的数据，包含新的时间范围 */
export interface DragCommitPayload {
    newStartHour: number
    newEndHour: number
}

/** 可拖拽的任务对象，扩展 DragTaskInput 以支持任意额外字段 */
export interface DraggableTask extends DragTaskInput {
    [key: string]: unknown
}

/** useTimelineDragSession 的输入参数 */
export interface TimelineDragSessionOptions {
    task: DraggableTask
    getTask?: () => DraggableTask
    onCommit: (payload: DragCommitPayload) => Promise<void>
}

/**
 * 时间轴拖拽会话管理 Composable
 *
 * 使用场景：Day 页面时间轴上任务的拖拽移动和底部边缘缩放
 * 数据流：鼠标事件 → 草稿计算 → onCommit → 数据库更新
 *
 * 管理完整的拖拽生命周期：激活阈值检测 → 草稿预览 → 提交/取消
 */
export function useTimelineDragSession({ task, getTask, onCommit }: TimelineDragSessionOptions) {
    // 拖拽激活阈值（像素），避免微小抖动误触发拖拽
    const ACTIVATION_THRESHOLD_PX = 6
    // 解析当前任务，优先使用 getTask 回调获取最新数据
    const resolveTask = (): DraggableTask => getTask?.() ?? task
    const initialTask = resolveTask()

    // 待激活的拖拽模式（鼠标按下时设定，超过阈值后才真正激活）
    const pendingDragMode: Ref<DragMode> = ref('idle')
    // 当前激活的拖拽模式，idle 表示未在拖拽中
    const dragMode: Ref<DragMode> = ref('idle')
    // 鼠标按下时的 Y 坐标，作为拖拽偏移量的基准点
    const startClientY: Ref<number> = ref(0)
    // 拖拽开始时的任务起始小时，用于计算偏移量
    const baseStartHour: Ref<number> = ref(initialTask.startHour)
    // 拖拽开始时的任务持续时长，用于拖拽移动时保持时长不变
    const baseDurationHours: Ref<number> = ref(initialTask.durationHours || 1)
    // 拖拽中的草稿起始小时，null 表示尚未开始拖拽
    const draftStartHour: Ref<number | null> = ref(null)
    // 拖拽中的草稿持续时长，null 表示尚未开始拖拽
    const draftDurationHours: Ref<number | null> = ref(null)
    // 保存中状态，防止重复提交
    const isSaving: Ref<boolean> = ref(false)
    // 最后一次提交错误，用于上层组件展示错误提示
    const lastError: Ref<unknown> = ref(null)

    // 是否处于活跃拖拽状态（drag 或 resize）
    const isActive: ComputedRef<boolean> = computed(() => dragMode.value !== 'idle')
    // 是否处于整体移动模式
    const isDragging: ComputedRef<boolean> = computed(() => dragMode.value === 'drag')
    // 是否处于底部缩放模式
    const isResizing: ComputedRef<boolean> = computed(() => dragMode.value === 'resize')
    // tooltip 显示的起始时间：拖拽中用草稿值，否则用基准值
    const tooltipHour: ComputedRef<number> = computed(() => draftStartHour.value ?? baseStartHour.value)
    // tooltip 显示的持续时长：拖拽中用草稿值，否则用基准值
    const tooltipDuration: ComputedRef<number> = computed(() => draftDurationHours.value ?? baseDurationHours.value)

    /**
     * 初始化拖拽基准数据
     * 鼠标按下时调用，记录起始位置和任务当前状态
     */
    function initDragBase(clientY: number, nextMode: DragMode) {
        const currentTask = resolveTask()
        pendingDragMode.value = nextMode
        dragMode.value = 'idle'
        startClientY.value = clientY
        baseStartHour.value = currentTask.startHour
        baseDurationHours.value = currentTask.durationHours || 1
        draftStartHour.value = null
        draftDurationHours.value = null
        lastError.value = null
    }

    /** 开始拖拽移动，记录鼠标按下位置 */
    function startDrag(event: MouseEvent) {
        initDragBase(event.clientY, 'drag')
    }

    /** 开始底部边缘缩放，记录鼠标按下位置 */
    function startResize(event: MouseEvent) {
        initDragBase(event.clientY, 'resize')
    }

    /**
     * 根据鼠标移动更新草稿数据
     * 核心逻辑：超过激活阈值后，根据拖拽模式计算新的时间位置
     */
    function updateFromMouse(event: MouseEvent) {
        const deltaY = event.clientY - startClientY.value
        const deltaPx = Math.abs(deltaY)

        // 既无待激活模式也无活跃模式时忽略
        if (pendingDragMode.value === 'idle' && dragMode.value === 'idle') return

        // 未超过激活阈值时不开始拖拽，避免误触
        if (dragMode.value === 'idle') {
            if (deltaPx < ACTIVATION_THRESHOLD_PX) return

            // 超过阈值，正式激活拖拽
            dragMode.value = pendingDragMode.value
            draftStartHour.value = baseStartHour.value
            draftDurationHours.value = baseDurationHours.value
        }

        const baseTask: DragTaskInput = {
            startHour: baseStartHour.value,
            durationHours: baseDurationHours.value
        }

        // 拖拽移动：保持时长不变，改变起始时间
        if (dragMode.value === 'drag') {
            const result = calcDragResult(baseTask, deltaY)
            draftStartHour.value = result.newStart
            draftDurationHours.value = baseDurationHours.value
            return
        }

        // 缩放：保持起始时间不变，改变时长
        if (dragMode.value === 'resize') {
            const nextHeight = baseDurationHours.value * HOUR_HEIGHT + deltaY
            const result = calcResizeResult(baseTask, nextHeight)
            draftStartHour.value = result.newStart
            draftDurationHours.value = result.newEnd - result.newStart
        }
    }

    /**
     * 完成拖拽：提交变更
     * 位置未变化时直接取消，避免无意义的数据库写入
     */
    async function finish() {
        if (dragMode.value === 'idle') {
            cancel()
            return
        }

        // 保存中忽略重复调用，防止并发提交
        if (isSaving.value) return

        const nextStart = draftStartHour.value ?? baseStartHour.value
        const nextDuration = draftDurationHours.value ?? baseDurationHours.value
        const nextEnd = nextStart + nextDuration

        // 位置未变化则不提交，直接取消
        if (nextStart === baseStartHour.value && nextDuration === baseDurationHours.value) {
            cancel()
            return
        }

        isSaving.value = true

        try {
            await onCommit({
                newStartHour: nextStart,
                newEndHour: nextEnd
            })
            cancel()
        } catch (error) {
            // 捕获提交错误，保存到 lastError 供上层展示
            lastError.value = error
            cancel()
        } finally {
            isSaving.value = false
        }
    }

    /** 取消拖拽，重置所有状态到初始值 */
    function cancel() {
        pendingDragMode.value = 'idle'
        dragMode.value = 'idle'
        draftStartHour.value = null
        draftDurationHours.value = null
    }

    return {
        isActive,
        isDragging,
        isResizing,
        isSaving,
        draftStartHour,
        draftDurationHours,
        tooltipHour,
        tooltipDuration,
        startDrag,
        startResize,
        updateFromMouse,
        finish,
        cancel,
        lastError
    }
}
