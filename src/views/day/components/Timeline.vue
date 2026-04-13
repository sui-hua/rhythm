<template>
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-linear-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 bg-background/40 backdrop-blur-xs transition-all duration-700"
    ></div>
    <div class="relative z-10 px-2 sm:px-4 md:px-10 lg:px-20 py-10 min-h-[600vh] timeline-wrapper" :style="{ '--hour-height': 'max(25vh, 180px)' }">
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
      <template v-for="item in displaySchedule" :key="item._originalIndex">
        <TaskItem
          :task="item"
          :index="item._originalIndex"
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

// 布局算法：计算相互重叠的日程使其并排显示
const displaySchedule = computed(() => {
  // 注入原始 index，以防改变日常排序后导致点击选区或编辑触发的下标错误
  const tasks = dailySchedule.value
    .map((t, idx) => ({ ...t, _originalIndex: idx }))
    .filter(t => t.startHour !== undefined)
  
  // 基于开始时间和持续时长做二次排序
  tasks.sort((a, b) => a.startHour - b.startHour || (b.durationHours || 1) - (a.durationHours || 1))

  let columns = []
  let lastEventEnding = null
  
  tasks.forEach((task) => {
    if (lastEventEnding !== null && task.startHour >= lastEventEnding) {
        packEvents(columns)
        columns = []
        lastEventEnding = null
    }
    let placed = false
    const dur = task.durationHours || 1
    for (let col of columns) {
      const lastInCol = col[col.length - 1]
      const lastDur = lastInCol.durationHours || 1
      if (lastInCol.startHour + lastDur <= task.startHour) {
        col.push(task)
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([task])
    }
    if (lastEventEnding === null || task.startHour + dur > lastEventEnding) {
      lastEventEnding = task.startHour + dur
    }
  })
  
  if (columns.length > 0) {
     packEvents(columns)
  }
  
  return tasks
})

function packEvents(columns) {
  const numCols = columns.length
  columns.forEach((col, i) => {
    col.forEach(t => {
      t._col = i
      t._numCols = numCols
    })
  })
}

const timelineContainerRef = ref(null)

defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

defineEmits(['edit-task', 'select-task'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

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
