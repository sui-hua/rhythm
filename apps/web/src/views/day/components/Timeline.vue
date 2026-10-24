<template>
  <!--
    Timeline — 每日时间轴视图，聚合展示当日所有日程项
    主要结构：加载遮罩、24 小时刻度背景、虚拟滚动任务列表、当前时间指示线
  -->
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-linear-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <!-- 加载遮罩：isLoading 为 true 时以毛玻璃效果覆盖整个时间轴 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 bg-background/40 backdrop-blur-xs transition-all duration-700"
    ></div>

    <!-- 时间轴主容器开始：z-10 置于背景刻度线之上，--hour-height 决定每小时格的高度 -->
    <div class="relative z-10 px-2 sm:px-4 md:px-10 lg:px-20 py-10 min-h-[600vh] timeline-wrapper" :style="{ '--hour-height': 'max(25vh, 180px)' }">
      <!-- 背景刻度线：遍历 24 小时渲染水平分隔线与时刻标签，始终全量渲染不含重量级组件 -->

      <div class="absolute inset-x-0 top-0 z-0 px-2 sm:px-4 md:px-10 lg:px-20">
        <div
          v-for="h in 24"
          :key="h"
          :id="`hour-${h-1}`"
          class="border-b transition-colors duration-300 flex items-start pt-3"
          :class="h % 3 === 0 ? 'border-border/60' : 'border-border/30'"
          :style="{ height: 'var(--hour-height)' }"
        >
          <!-- 小时标签区：圆点 + 时刻文字 (HH:00)，整点 3 的倍数时加强显示 -->
          <div class="flex items-center gap-3 sm:-ml-2">
            <div
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="h % 3 === 0 ? 'bg-primary/40 shadow-sm' : 'bg-muted-foreground/20'"
            ></div>
            <span
              class="text-[11px] font-mono font-bold tracking-tight transition-colors duration-300"
              :class="h % 3 === 0 ? 'text-foreground/70' : 'text-muted-foreground/40'"
            >
              <!-- h 从 1 开始循环，显示时需减 1 得到 00:00 ~ 23:00 -->
              {{ String(h-1).padStart(2, '0') }}:00
            </span>
          </div>
        </div>
      </div>

      <!-- 背景刻度线结束 -->

      <!-- 日程项列表：虚拟滚动，仅渲染可见时间范围内的任务 -->
      <template v-for="item in visibleSchedule" :key="item._originalIndex">
        <TaskItemWrapper
          :task="item"
          :index="item._originalIndex ?? 0"
          @select="$emit('select-task', $event)"
          @edit="$emit('edit-task', $event)"
        />
      </template>

      <!-- 当前时间指示线，标记此刻在时间轴上的位置 -->
      <TimelineMarker :current-hour="currentHour" />
    </div>
    <!-- 时间轴主容器结束 -->
  </ScrollArea>
</template>

<script lang="ts" setup>
/**
 * Timeline — 每日时间轴视图组件
 * 数据流：dayStore.dailySchedule → buildTimelineDisplaySchedule（贪心列分配）→ visibleSchedule（虚拟滚动过滤）→ TaskItemWrapper 渲染
 * 使用 @tanstack/vue-virtual 实现 24 小时行的虚拟滚动，仅渲染可见时间窗口内的任务
 */

// ── 依赖导入 ──
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { ScrollArea } from '@/components/ui/scroll-area'
import TaskItemWrapper from '@/views/day/components/TaskItemWrapper.vue'
import TimelineMarker from '@/views/day/components/TimelineMarker.vue'
import { useDayStore } from '@/stores/dayStore'
import { buildTimelineDisplaySchedule } from '@/views/day/utils/timelineLayout'

// ── Props ──
// currentHour: 当前小时数，用于时间指示线定位 | isLoading: 加载状态，控制遮罩显隐
const props = defineProps({
  currentHour: { type: Number, required: true },
  isLoading: { type: Boolean, default: false }
})

// ── Store ──
const dayStore = useDayStore()

// ── 计算属性 ──
// 贪心列分配：处理重叠日程的并排布局，返回带列位置信息的日程列表
const displaySchedule = computed(() => {
  return buildTimelineDisplaySchedule(dayStore.dailySchedule)
})

// ── Refs ──
// timelineContainerRef: ScrollArea 组件引用，用于获取 viewport DOM
const timelineContainerRef = ref<InstanceType<typeof ScrollArea> | null>(null)
// scrollElement: 实际滚动容器元素，供虚拟化器使用
const scrollElement = ref<HTMLElement | null>(null)

// ── 虚拟滚动 ──
// --hour-height 是响应式 CSS 值 max(25vh, 180px)，需要在运行时动态计算实际像素
const hourHeightPx = ref(0)

// 测量当前 --hour-height 的实际像素值并更新，响应窗口缩放
function updateHourHeight() {
  const el = scrollElement.value
  if (!el) return
  const wrapper = el.querySelector('.timeline-wrapper')
  if (!wrapper) return
  hourHeightPx.value = parseFloat(getComputedStyle(wrapper).getPropertyValue('--hour-height')) || 180
}

// 使用 @tanstack/vue-virtual 虚拟化 24 个小时行，追踪可见时间范围
const virtualizer = useVirtualizer({
  count: 24,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => hourHeightPx.value || 180,
  overscan: 3
})

// 从虚拟化器的范围推算当前可见的小时区间（带 overscan 缓冲）
const virtualRange = computed(() => virtualizer.value.range)
const visibleStartHour = computed(() => Math.max(0, Math.floor(virtualRange.value?.startIndex ?? 0)))
const visibleEndHour = computed(() => Math.min(24, (virtualRange.value?.endIndex ?? 23) + 1))

// 仅渲染落入可见时间窗口的任务（含跨越窗口的重叠项）
const visibleSchedule = computed(() => {
  return displaySchedule.value.filter(item => {
    // buildTimelineDisplaySchedule 已过滤无 startHour 的条目，此处可安全断言
    const start = item.startHour!
    const itemEnd = start + (item.durationHours || 1)
    return start < visibleEndHour.value && itemEnd > visibleStartHour.value
  })
})

// ── Expose ──
// 暴露 viewport DOM 供父组件调用 scrollToTask 定位到具体任务
defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

// ── Emits ──
// edit-task: 编辑任务 | select-task: 选中任务
defineEmits(['edit-task', 'select-task'])

// ── 生命周期 ──
// ResizeObserver 实例，用于监听视口尺寸变化时重新计算小时格高度
let resizeObserver: ResizeObserver | null = null

// ScrollArea 挂载后获取 viewport 元素引用，用于虚拟滚动和高度测量
watch(timelineContainerRef, (ref) => {
  scrollElement.value = ref?.viewportElement ?? null
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    updateHourHeight()
    // 监听视口尺寸变化（含窗口缩放），重新计算 --hour-height 的实际像素
    if (scrollElement.value) {
      resizeObserver = new ResizeObserver(() => updateHourHeight())
      resizeObserver.observe(scrollElement.value)
    }
  })
})

// 组件卸载前断开 ResizeObserver，避免内存泄漏
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.timeline-wrapper {
  --timeline-left: 1.5rem; /* ~ pl-6 */
}
@media (min-width: 640px) {
  .timeline-wrapper {
    --timeline-left: 6rem; /* ~ pl-24 */
  }
}
@media (min-width: 768px) {
  .timeline-wrapper {
    --timeline-left: 9rem; /* ~ pl-36 */
  }
}
</style>
