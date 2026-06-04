import { computed, ref } from 'vue'
import { HOUR_HEIGHT, calcDragResult, calcResizeResult } from '@/views/day/composables/useDragSnap'

export function useTimelineDragSession({ task, getTask, onCommit }) {
  const ACTIVATION_THRESHOLD_PX = 6
  const resolveTask = () => getTask?.() ?? task
  const initialTask = resolveTask()
  const pendingDragMode = ref('idle')
  const dragMode = ref('idle')
  const startClientY = ref(0)
  const baseStartHour = ref(initialTask.startHour)
  const baseDurationHours = ref(initialTask.durationHours || 1)
  const draftStartHour = ref(null)
  const draftDurationHours = ref(null)
  const isSaving = ref(false)
  const lastError = ref(null)

  const isActive = computed(() => dragMode.value !== 'idle')
  const isDragging = computed(() => dragMode.value === 'drag')
  const isResizing = computed(() => dragMode.value === 'resize')
  const tooltipHour = computed(() => draftStartHour.value ?? baseStartHour.value)
  const tooltipDuration = computed(() => draftDurationHours.value ?? baseDurationHours.value)

  function initDragBase(clientY, nextMode) {
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

  function startDrag(event) {
    initDragBase(event.clientY, 'drag')
  }

  function startResize(event) {
    initDragBase(event.clientY, 'resize')
  }

  function updateFromMouse(event) {
    const deltaY = event.clientY - startClientY.value
    const deltaPx = Math.abs(deltaY)

    if (pendingDragMode.value === 'idle' && dragMode.value === 'idle') return

    if (dragMode.value === 'idle') {
      if (deltaPx < ACTIVATION_THRESHOLD_PX) return

      dragMode.value = pendingDragMode.value
      draftStartHour.value = baseStartHour.value
      draftDurationHours.value = baseDurationHours.value
    }

    const baseTask = {
      startHour: baseStartHour.value,
      durationHours: baseDurationHours.value
    }

    if (dragMode.value === 'drag') {
      const result = calcDragResult(baseTask, deltaY)
      draftStartHour.value = result.newStart
      draftDurationHours.value = baseDurationHours.value
      return
    }

    if (dragMode.value === 'resize') {
      const nextHeight = baseDurationHours.value * HOUR_HEIGHT + deltaY
      const result = calcResizeResult(baseTask, nextHeight)
      draftStartHour.value = result.newStart
      draftDurationHours.value = result.newEnd - result.newStart
    }
  }

  async function finish() {
    if (dragMode.value === 'idle') {
      cancel()
      return
    }

    if (isSaving.value) return

    const nextStart = draftStartHour.value ?? baseStartHour.value
    const nextDuration = draftDurationHours.value ?? baseDurationHours.value
    const nextEnd = nextStart + nextDuration

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
