<template>
  <ScrollArea ref="timelineContainerRef" class="timeline">
    <div class="timeline__canvas">
      <!-- 背景时间轴线 -->
      <div class="timeline__grid">
        <div 
          v-for="h in 24" 
          :key="h" 
          :id="`hour-${h-1}`"
          class="timeline__hour-row" 
          :class="h % 3 === 0 ? 'timeline__hour-row--major' : 'timeline__hour-row--minor'"
        >
          <div class="timeline__hour-label">
            <div class="timeline__hour-dot" :class="h % 3 === 0 ? 'timeline__hour-dot--major' : 'timeline__hour-dot--minor'"></div>
            <span class="timeline__hour-text" :class="h % 3 === 0 ? 'timeline__hour-text--major' : 'timeline__hour-text--minor'">{{ String(h-1).padStart(2, '0') }}:00</span>
          </div>
        </div>
      </div>

      <!-- 渲染具体日程项目 (TaskItem 组件) -->
      <template v-for="(item, index) in dailySchedule" :key="index">
        <TaskItem
            v-if="item.startHour !== undefined"
            :task="item"
            :index="index"
            @select="$emit('select-task', $event)"
            @edit="$emit('edit-task', $event)"
        />
      </template>
      
      <!-- 当前时间指示线 (TimelineMarker 组件) -->
      <TimelineMarker :current-hour="currentHour" />
    </div>
  </ScrollArea>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import TaskItem from './TaskItem.vue'
import TimelineMarker from './TimelineMarker.vue'
import { useDayData } from '../composables/useDayData'
import { useDayNavigation } from '../composables/useDayNavigation'

const { dailySchedule } = useDayData()
const { currentHour } = useDayNavigation()

const timelineContainerRef = ref(null)

defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

defineEmits(['edit-task', 'select-task'])
</script>

<style scoped>
@reference "@/assets/main.css";
.timeline {
  @apply flex-1 bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 relative;
}
.timeline__canvas {
  @apply relative z-10 px-10 md:px-20 py-10 min-h-[600vh];
}
.timeline__grid {
  @apply absolute inset-x-0 top-0 z-0 px-10 md:px-20;
}
.timeline__hour-row {
  @apply h-[25vh] border-b transition-colors duration-300 flex items-start pt-3;
}
.timeline__hour-row--major {
  @apply border-border/60;
}
.timeline__hour-row--minor {
  @apply border-border/30;
}
.timeline__hour-label {
  @apply flex items-center gap-3 -ml-2;
}
.timeline__hour-dot {
  @apply w-2 h-2 rounded-full transition-all duration-300;
}
.timeline__hour-dot--major {
  @apply bg-primary/40 shadow-sm;
}
.timeline__hour-dot--minor {
  @apply bg-muted-foreground/20;
}
.timeline__hour-text {
  @apply text-[11px] font-mono font-bold tracking-tight transition-colors duration-300;
}
.timeline__hour-text--major {
  @apply text-foreground/70;
}
.timeline__hour-text--minor {
  @apply text-muted-foreground/40;
}
</style>