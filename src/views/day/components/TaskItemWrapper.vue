<template>
  <!-- 不可拖拽的任务直接渲染 TaskItem -->
  <TaskItem
    v-if="!canDrag"
    :task="task"
    :index="index"
    @select="$emit('select', $event)"
    @edit="$emit('edit', $event)"
  />

  <!-- 可拖拽的任务：原生 mousedown 实现拖拽/缩放 -->
  <div
    v-else
    ref="wrapperRef"
    class="absolute group/vdr"
    :style="wrapperStyle"
  >
    <div
      class="w-full h-full transition-shadow duration-200"
      :class="[
        isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'cursor-grab',
        isResizing ? 'opacity-80 z-50 cursor-ns-resize' : ''
      ]"
      @mousedown.prevent="onDragStart"
    >
      <TaskItem
        :task="task"
        :index="index"
        :embedded="true"
        @select="$emit('select', $event)"
        @edit="$emit('edit', $event)"
      />
    </div>

    <DragTimeTooltip
      :currentHour="tooltipHour"
      :durationHours="tooltipDuration"
      :visible="isActive"
      :cardElement="wrapperRef"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import TaskItem from '@/views/day/components/TaskItem.vue'
import DragTimeTooltip from '@/views/day/components/DragTimeTooltip.vue'
import { useDayStore } from '@/stores/dayStore'
import { useTimelineDragSession } from '@/views/day/composables/useTimelineDragSession'
import { buildTaskHorizontalLayoutStyle } from '@/views/day/utils/taskLayoutStyle'

const props = defineProps({
  task: { type: Object, required: true },
  index: { type: Number, required: true }
})

const emit = defineEmits(['select', 'edit'])

const dayStore = useDayStore()

const canDrag = computed(() => !props.task.completed && props.task.type === 'task')

const wrapperRef = ref(null)
const session = useTimelineDragSession({
  getTask: () => props.task,
  onCommit: ({ newStartHour, newEndHour }) => dayStore.updateTaskTime(props.task, newStartHour, newEndHour)
})

const isDragging = computed(() => session.isDragging.value)
const isResizing = computed(() => session.isResizing.value)
const isActive = computed(() => session.isActive.value)
const tooltipHour = computed(() => session.tooltipHour.value)
const tooltipDuration = computed(() => session.tooltipDuration.value)
const displayStartHour = computed(() => session.draftStartHour.value ?? props.task.startHour)
const displayDurationHours = computed(() => session.draftDurationHours.value ?? (props.task.durationHours || 1))

// 卡片定位样式
const wrapperStyle = computed(() => {
  return {
    top: `calc(${displayStartHour.value} * var(--hour-height))`,
    height: `calc(${displayDurationHours.value} * var(--hour-height))`,
    ...buildTaskHorizontalLayoutStyle(props.task)
  }
})

function handleMouseMove(event) {
  session.updateFromMouse(event)
}

let listenersBound = false

function handleMouseUp() {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  listenersBound = false
  session.finish()
}

function bindDocumentSession() {
  if (listenersBound) return
  listenersBound = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function onDragStart(event) {
  session.startDrag(event)
  bindDocumentSession()
}

// 组件卸载时清理全局事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  session.cancel()
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
