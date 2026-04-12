<template>
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-linear-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 bg-background/40 backdrop-blur-xs transition-all duration-700"
    ></div>
    <div class="relative z-10 px-2 sm:px-4 md:px-10 lg:px-20 py-10 min-h-[600vh]" :style="{ '--hour-height': 'max(25vh, 180px)' }">
      <!-- 背景时间轴线 -->
      <div class="absolute inset-x-0 top-0 z-0 px-2 sm:px-4 md:px-10 lg:px-20">
        <div 
          v-for="h in 24" 
          :key="h" 
          :id="`hour-${h-1}`"
          class="border-b transition-colors duration-300 flex items-start pt-3"
          :class="h % 3 === 0 ? 'border-border/60' : 'border-border/30'"
          :style="{ height: 'var(--hour-height)' }"
        >
          <div class="flex items-center gap-3 sm:-ml-2">
            <div
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="h % 3 === 0 ? 'bg-primary/40 shadow-sm' : 'bg-muted-foreground/20'"
            ></div>
            <span
              class="text-[11px] font-mono font-bold tracking-tight transition-colors duration-300"
              :class="h % 3 === 0 ? 'text-foreground/70' : 'text-muted-foreground/40'"
            >
              {{ String(h-1).padStart(2, '0') }}:00
            </span>
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
import TaskItem from '@/views/day/components/TaskItem.vue'
import TimelineMarker from '@/views/day/components/TimelineMarker.vue'
import { useDayData } from '@/views/day/composables/useDayData'

const props = defineProps({
  currentHour: {
    type: Number,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const { dailySchedule } = useDayData()

const timelineContainerRef = ref(null)

defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

defineEmits(['edit-task', 'select-task'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
