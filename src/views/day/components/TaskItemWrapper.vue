<template>
  <!--
    TaskItemWrapper — 时间轴任务卡片包装器
    根据任务状态分两种渲染模式：不可拖拽（已完成或非任务类型）直接渲染 TaskItem，
    可拖拽时用绝对定位容器包裹 TaskItem + 拖拽时间提示
  -->

  <!-- 不可拖拽的任务：直接渲染 TaskItem，无拖拽交互 -->
  <TaskItem
    v-if="!canDrag"
    :task="task"
    :index="index"
    @select="$emit('select', $event)"
    @edit="$emit('edit', $event)"
  />

  <!-- 可拖拽任务容器开始：绝对定位 + mousedown 拖拽/缩放 -->
  <div
    v-else
    ref="wrapperRef"
    class="absolute group/vdr"
    :style="wrapperStyle"
  >
    <!-- 拖拽/缩放交互层：光标样式根据当前状态切换 -->
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

    <!-- 拖拽时间提示：拖拽过程中显示目标时间 -->
    <DragTimeTooltip
      :currentHour="tooltipHour"
      :durationHours="tooltipDuration"
      :visible="isActive"
      :cardElement="wrapperRef as any"
    />
  </div>
  <!-- 可拖拽任务容器结束 -->
</template>

<script lang="ts" setup>
/**
 * TaskItemWrapper — 时间轴任务卡片包装器
 * 数据流：props（task/index）→ useTimelineDragSession（拖拽状态机）→ dayStore.updateTaskTime（提交时间变更）
 * 已完成或非任务类型直接渲染 TaskItem；可拖拽时通过绝对定位实现时间轴拖拽和缩放
 */

// ── 依赖导入 ──
import { ref, computed, onBeforeUnmount } from 'vue'
import TaskItem from '@/views/day/components/TaskItem.vue'
import DragTimeTooltip from '@/views/day/components/DragTimeTooltip.vue'
import { useDayStore } from '@/stores/dayStore'
import { useTimelineDragSession } from '@/views/day/composables/useTimelineDragSession'
import { buildTaskHorizontalLayoutStyle } from '@/views/day/utils/taskLayoutStyle'
import type { DailyScheduleItem } from '@/types/models'

// ── Props ──
// task: 当前日程项数据 | index: 在列表中的序号
const props = defineProps({
  task: { type: Object as () => DailyScheduleItem, required: true },
  index: { type: Number, required: true }
})

// ── Emits ──
// select: 选中任务卡片 | edit: 编辑任务
const emit = defineEmits(['select', 'edit'])

// ── Store ──
const dayStore = useDayStore()

// ── 计算属性 ──
// 是否可拖拽：仅未完成的任务类型可拖拽，已完成和习惯类型不可拖拽
const canDrag = computed(() => !props.task.completed && props.task.type === 'task')

// ── 拖拽会话 ──
// wrapperRef 用于定位卡片在时间轴上的绝对位置
const wrapperRef = ref<HTMLElement | null>(null)

// 拖拽状态机：管理拖拽/缩放的完整生命周期，提交时调用 dayStore 更新时间
const session = useTimelineDragSession({
  task: props.task as any,
  getTask: () => props.task as any,
  onCommit: ({ newStartHour, newEndHour }: { newStartHour: number; newEndHour: number }) => dayStore.updateTaskTime(props.task as any, newStartHour, newEndHour)
})

// 拖拽状态：isDragging 拖拽中 | isResizing 缩放中 | isActive 拖拽或缩放进行中
const isDragging = computed(() => session.isDragging.value)
const isResizing = computed(() => session.isResizing.value)
const isActive = computed(() => session.isActive.value)

// 时间提示：拖拽过程中显示目标开始时间和时长
const tooltipHour = computed(() => session.tooltipHour.value)
const tooltipDuration = computed(() => session.tooltipDuration.value)

// 显示位置：拖拽中使用草稿值，否则使用任务原始值
const displayStartHour = computed(() => session.draftStartHour.value ?? props.task.startHour)
const displayDurationHours = computed(() => session.draftDurationHours.value ?? (props.task.durationHours || 1))

// 卡片绝对定位样式：top 和 height 基于 --hour-height CSS 变量计算
const wrapperStyle = computed(() => {
  return {
    top: `calc(${displayStartHour.value} * var(--hour-height))`,
    height: `calc(${displayDurationHours.value} * var(--hour-height))`,
    ...buildTaskHorizontalLayoutStyle(props.task as any)
  }
})

// ── 方法 ──
// 鼠标移动时更新拖拽位置
function handleMouseMove(event: MouseEvent) {
  session.updateFromMouse(event)
}

// 标记全局监听器是否已绑定，防止重复绑定
let listenersBound = false

// 鼠标松开时清理监听器并完成拖拽提交
function handleMouseUp() {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  listenersBound = false
  session.finish()
}

// 绑定 document 级别的鼠标事件，用于捕获拖拽过程中的移动和释放
function bindDocumentSession() {
  if (listenersBound) return
  listenersBound = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 拖拽开始：初始化拖拽会话并绑定全局事件
function onDragStart(event: MouseEvent) {
  session.startDrag(event)
  bindDocumentSession()
}

// ── 生命周期 ──
// 组件卸载时清理全局事件监听，防止内存泄漏
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  session.cancel()
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
