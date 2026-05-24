<template>
  <!-- 不可拖拽的任务直接渲染 TaskItem -->
  <TaskItem
    v-if="!canDrag"
    :task="task"
    :index="index"
    @select="$emit('select', $event)"
    @edit="$emit('edit', $event)"
  />

  <!-- 可拖拽的任务包裹 VDR -->
  <div v-else ref="wrapperRef" class="absolute" :style="wrapperStyle">
    <VueDraggableResizable
      :x="0"
      :y="hourToPx(task.startHour)"
      :w="cardWidth"
      :h="hourToPx(task.durationHours)"
      :minHeight="SNAP_PX"
      :snap="{ x: 0, y: SNAP_PX }"
      :axis="'y'"
      :parent="true"
      :draggable="true"
      :resizable="true"
      :active="false"
      class="absolute"
      :class="dragClass"
      @dragging="onDragging"
      @drag-end="onDragEnd"
      @resizing="onResizing"
      @resize-end="onResizeEnd"
    >
      <TaskItem
        :task="task"
        :index="index"
        @select="$emit('select', $event)"
        @edit="$emit('edit', $event)"
      />
    </VueDraggableResizable>

    <DragTimeTooltip
      :currentHour="tooltipHour"
      :durationHours="tooltipDuration"
      :visible="isDragging"
      :cardElement="cardRef"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { VueDraggableResizable } from 'vue3-draggable-resizable'
import TaskItem from '@/views/day/components/TaskItem.vue'
import DragTimeTooltip from '@/views/day/components/DragTimeTooltip.vue'
import { hourToPx, pxToHour, SNAP_PX, calcDragResult, calcResizeResult } from '@/views/day/composables/useDragSnap'
import { useDayData } from '@/views/day/composables/useDayData'

const props = defineProps({
  task: { type: Object, required: true },
  index: { type: Number, required: true }
})

const emit = defineEmits(['select', 'edit'])

const { updateTaskTime } = useDayData()

// 是否可拖拽：仅未完成的普通任务
const canDrag = computed(() => !props.task.completed && props.task.type === 'task')

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const tooltipHour = ref(props.task.startHour)
const tooltipDuration = ref(props.task.durationHours)

// DOM 引用
const wrapperRef = ref(null)
const cardRef = ref(null)

onMounted(() => {
  cardRef.value = wrapperRef.value
})

// 拖拽中的视觉反馈 class
const dragClass = computed(() => {
  if (isDragging.value || isResizing.value) {
    return 'opacity-70 shadow-lg scale-[1.02] z-50'
  }
  return ''
})

// VDR 宽度：沿用 TaskItem 原有的宽度计算逻辑
// 使用 CSS 变量 --timeline-left 和列布局
const cardWidth = computed(() => {
  const col = props.task._col || 0
  const numCols = props.task._numCols || 1
  if (numCols > 1) {
    return `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`
  }
  return -1 // -1 = 100%
})

// VDR 的 left 定位
const wrapperStyle = computed(() => {
  const col = props.task._col || 0
  const numCols = props.task._numCols || 1
  if (numCols > 1) {
    return {
      left: `calc(var(--timeline-left) + ((100% - var(--timeline-left)) / ${numCols}) * ${col})`,
      width: `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`,
      height: hourToPx(props.task.durationHours) + 'px'
    }
  }
  return {
    left: 'var(--timeline-left)',
    right: 0,
    height: hourToPx(props.task.durationHours) + 'px'
  }
})

// ── 拖拽事件处理 ──────────────────────────────────────────────────────────

const onDragging = ({ y }) => {
  isDragging.value = true
  tooltipHour.value = pxToHour(y)
}

const onDragEnd = async ({ y }) => {
  isDragging.value = false
  const { newStart, newEnd } = calcDragResult(props.task, y - hourToPx(props.task.startHour))
  if (newStart !== props.task.startHour) {
    await updateTaskTime(props.task, newStart, newEnd)
  }
}

const onResizing = ({ h }) => {
  isResizing.value = true
  const duration = pxToHour(h)
  tooltipHour.value = props.task.startHour
  tooltipDuration.value = duration
}

const onResizeEnd = async ({ h }) => {
  isResizing.value = false
  const { newStart, newEnd } = calcResizeResult(props.task, h)
  if (newEnd !== props.task.startHour + props.task.durationHours) {
    await updateTaskTime(props.task, newStart, newEnd)
  }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
