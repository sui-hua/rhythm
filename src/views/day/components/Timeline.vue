<template>
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <div class="relative z-10 px-10 md:px-20 py-10 min-h-[600vh]">
      <!-- 背景时间轴线 -->
      <div class="absolute inset-x-0 top-0 z-0 px-10 md:px-20">
        <div 
          v-for="h in 24" 
          :key="h" 
          :id="`hour-${h-1}`"
          class="h-[25vh] border-b transition-colors duration-300 flex items-start pt-3" 
          :class="h % 3 === 0 ? 'border-border/60' : 'border-border/30'"
        >
          <div class="flex items-center gap-3 -ml-2">
            <div class="w-2 h-2 rounded-full transition-all duration-300" :class="h % 3 === 0 ? 'bg-primary/40 shadow-sm' : 'bg-muted-foreground/20'"></div>
            <span class="text-[11px] font-mono font-bold tracking-tight transition-colors duration-300" :class="h % 3 === 0 ? 'text-foreground/70' : 'text-muted-foreground/40'">{{ String(h-1).padStart(2, '0') }}:00</span>
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

const props = defineProps({
  dailySchedule: Array, // 整合后的每日日程列表，包含各任务的具体显示参数
  currentHour: Number // 当前时间（以小数形式表示的小时数，用于计算当前时间线位置）
})

const timelineContainerRef = ref(null)

// 将滚动容器的元素暴露给父组件使用
defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

// 定义向父组件发射的事件
defineEmits(['edit-task', 'select-task'])
</script>