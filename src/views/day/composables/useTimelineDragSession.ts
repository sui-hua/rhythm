import { computed, ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { HOUR_HEIGHT, calcDragResult, calcResizeResult } from '@/views/day/composables/useDragSnap'
import type { DragTaskInput } from '@/views/day/composables/useDragSnap'

/** 拖拽模式：idle | drag | resize */
type DragMode = 'idle' | 'drag' | 'resize'

/** 拖拽提交时传递的数据 */
export interface DragCommitPayload {
    newStartHour: number
    newEndHour: number
}

/** 可拖拽的任务对象 */
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
 * 时间轴拖拽会话管理
 * 处理任务在时间轴上的拖拽移动和底部边缘缩放
 */
export function useTimelineDragSession({ task, getTask, onCommit }: TimelineDragSessionOptions) {
    const ACTIVATION_THRESHOLD_PX = 6
    const resolveTask = (): DraggableTask => getTask?.() ?? task
    const initialTask = resolveTask()

    // 待激活的拖拽模式（鼠标按下时设定，超过阈值后激活）
    const pendingDragMode: Ref<DragMode> = ref('idle')
    // 当前激活的拖拽模式
    const dragMode: Ref<DragMode> = ref('idle')
    // 鼠标按下时的 Y 坐标
    const startClientY: Ref<number> = ref(0)
    // 拖拽开始时的任务起始小时
    const baseStartHour: Ref<number> = ref(initialTask.startHour)
    // 拖拽开始时的任务持续时长
    const baseDurationHours: Ref<number> = ref(initialTask.durationHours || 1)
    // 拖拽中的草稿起始小时（null 表示未开始拖拽）
    const draftStartHour: Ref<number | null> = ref(null)
    // 拖拽中的草稿持续时长
    const draftDurationHours: Ref<number | null> = ref(null)
    // 保存中状态
    const isSaving: Ref<boolean> = ref(false)
    // 最后一次错误
    const lastError: Ref<unknown> = ref(null)

    // 计算属性：是否处于活跃拖拽状态
    const isActive: ComputedRef<boolean> = computed(() => dragMode.value !== 'idle')
    const isDragging: ComputedRef<boolean> = computed(() => dragMode.value === 'drag')
    const isResizing: ComputedRef<boolean> = computed(() => dragMode.value === 'resize')
    // tooltip 显示的时间：优先使用草稿值，否则使用基准值
    const tooltipHour: ComputedRef<number> = computed(() => draftStartHour.value ?? baseStartHour.value)
    const tooltipDuration: ComputedRef<number> = computed(() => draftDurationHours.value ?? baseDurationHours.value)

    // 初始化拖拽基准数据
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

    // 开始拖拽移动
    function startDrag(event: MouseEvent) {
        initDragBase(event.clientY, 'drag')
    }

    // 开始缩放（底部边缘拖拽）
    function startResize(event: MouseEvent) {
        initDragBase(event.clientY, 'resize')
    }

    // 根据鼠标移动更新草稿数据
    function updateFromMouse(event: MouseEvent) {
        const deltaY = event.clientY - startClientY.value
        const deltaPx = Math.abs(deltaY)

        if (pendingDragMode.value === 'idle' && dragMode.value === 'idle') return

        // 未超过激活阈值时不开始拖拽
        if (dragMode.value === 'idle') {
            if (deltaPx < ACTIVATION_THRESHOLD_PX) return

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

    // 完成拖拽：提交变更
    async function finish() {
        if (dragMode.value === 'idle') {
            cancel()
            return
        }

        if (isSaving.value) return

        const nextStart = draftStartHour.value ?? baseStartHour.value
        const nextDuration = draftDurationHours.value ?? baseDurationHours.value
        const nextEnd = nextStart + nextDuration

        // 位置未变化则不提交
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
            lastError.value = error
            cancel()
        } finally {
            isSaving.value = false
        }
    }

    // 取消拖拽，重置所有状态
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
