<template>
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-zinc-50/30 relative">
    <div class="relative z-10 px-10 md:px-20 py-10 min-h-[600vh]">
      <!-- 背景时间轴线 -->
      <div class="absolute inset-x-0 top-0 z-0 px-10 md:px-20">
        <div v-for="h in 24" :key="h" class="h-[25vh] border-b border-border/50 flex items-start pt-4">
          <span class="text-[10px] font-mono font-bold text-muted-foreground/30">{{ String(h-1).padStart(2, '0') }}:00</span>
        </div>
      </div>

      <!-- TaskItem 组件 -->
      <TaskItem
          v-for="(item, index) in dailySchedule"
          :key="index"
          :task="item"
          :index="index"
          @select="$emit('select-task', $event)"
          @edit="$emit('edit-task', $event)"
      />
      
      <!-- TimelineMarker 组件 -->
      <TimelineMarker :current-hour="currentHour" />
    </div>
  </ScrollArea>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import TaskItem from './TaskItem.vue'
import TimelineMarker from './TimelineMarker.vue'

defineProps({
  selectedDay: Number,
  dailySchedule: Array,
  currentHour: Number
})

const timelineContainerRef = ref(null)

defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

defineEmits(['edit-task', 'select-task'])
</script>