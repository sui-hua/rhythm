<template>
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-linear-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <!-- 加载遮罩：isLoading 为 true 时以毛玻璃效果覆盖整个时间轴 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 bg-background/40 backdrop-blur-xs transition-all duration-700"
    ></div>
    <!-- 时间轴主容器：z-10 置于背景刻度线之上；--hour-height 决定每小时格的高度 -->
    <div class="relative z-10 px-2 sm:px-4 md:px-10 lg:px-20 py-10 min-h-[600vh] timeline-wrapper" :style="{ '--hour-height': 'max(25vh, 180px)' }">
      <!-- 背景时间轴线 -->
      <!-- 遍历 24 小时，渲染水平分隔线与时刻标签 -->
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

      <!-- 渲染具体日程项目 -->
      <template v-for="item in displaySchedule" :key="item._originalIndex">
        <TaskItemWrapper
          :task="item"
          :index="item._originalIndex"
          @select="$emit('select-task', $event)"
          @edit="$emit('edit-task', $event)"
        />
      </template>
      
      <!-- 当前时间指示线 -->
      <TimelineMarker :current-hour="currentHour" />
    </div>
  </ScrollArea>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import TaskItemWrapper from '@/views/day/components/TaskItemWrapper.vue'
import TimelineMarker from '@/views/day/components/TimelineMarker.vue'
import { useDayStore } from '@/stores/dayStore'
import { buildTimelineDisplaySchedule } from '@/views/day/utils/timelineLayout'

// ── Props ──
const props = defineProps({
  currentHour: { type: Number, required: true },
  isLoading: { type: Boolean, default: false }
})

// ── 数据源 ──
const dayStore = useDayStore()

// 贪心列分配：处理重叠日程的并排布局
const displaySchedule = computed(() => {
  return buildTimelineDisplaySchedule(dayStore.dailySchedule)
})

// ── Refs ──
const timelineContainerRef = ref(null)

// ── Expose ──
// 暴露 viewport DOM 供父组件滚动定位
defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

// ── Emits ──
defineEmits(['edit-task', 'select-task'])
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
