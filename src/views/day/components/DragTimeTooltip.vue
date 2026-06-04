<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="visible"
        class="fixed z-[9999] px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide
               bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900
               shadow-lg backdrop-blur-sm pointer-events-none select-none"
        :style="tooltipStyle"
      >
        {{ startTime }} — {{ endTime }}
        <!-- 小三角箭头 -->
        <div
          class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                 bg-zinc-900/90 dark:bg-zinc-100/90"
          :class="arrowClass"
        ></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  /** 当前小时（浮点数） */
  currentHour: { type: Number, required: true },
  /** 任务时长（小时） */
  durationHours: { type: Number, required: true },
  /** 是否显示 */
  visible: { type: Boolean, default: false },
  /** 卡片 DOM 元素（用于定位） */
  cardElement: { type: Object, default: null }
})

/** 格式化小时为 HH:mm */
const formatTime = (hour: number) => {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const startTime = computed(() => formatTime(props.currentHour))
const endTime = computed(() => formatTime(props.currentHour + props.durationHours))

/** 定位在卡片右侧 */
const tooltipStyle = computed(() => {
  if (!props.cardElement) return { display: 'none' }
  const rect = props.cardElement.getBoundingClientRect()
  return {
    left: `${rect.right + 8}px`,
    top: `${rect.top + rect.height / 2 - 14}px`
  }
})

const arrowClass = computed(() => '-left-1')
</script>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
