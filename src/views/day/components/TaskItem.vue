<template>
  <div
    :id="'task-' + index"
    class="absolute transition-all duration-700 cursor-pointer select-none group/task"
    :style="computedStyle"
    @click="$emit('select', index)"
    @dblclick="$emit('edit', index)"
  >
    <div 
      class="flex h-full relative overflow-hidden transition-all duration-500 rounded-2xl group border shadow-sm"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-row items-center py-1 px-4 min-h-[32px]' : 
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2 px-5' : 'flex-col py-4 px-5 gap-2',
        task.completed 
          ? 'opacity-60 grayscale border-zinc-200/60 bg-zinc-50/80 dark:border-white/5 dark:bg-white/5 shadow-none' 
          : 'bg-white/95 backdrop-blur-md border-black/5 dark:border-white/10 dark:bg-zinc-900/95 hover:-translate-y-0.5 hover:shadow-md hover:border-black/10 dark:hover:border-white/20',
        isRunning ? 'ring-2 ring-primary border-transparent' : ''
      ]"
    >
      <!-- 左侧任务状态指示条 -->
      <div 
        class="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500"
        :class="task.completed ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-primary'"
      ></div>

      <!-- Title for MEDIUM tasks - Simple mode -->
      <template v-if="(task.durationHours || 1) >= 0.4 && (task.durationHours || 1) < 0.8">
        <h3 
          class="flex-1 text-sm font-semibold tracking-tight transition-transform duration-300 truncate"
          :class="!task.completed ? 'text-zinc-900 dark:text-zinc-100 group-hover/task:translate-x-1' : 'line-through text-zinc-500'"
        >
          {{ task.title }}
        </h3>
      </template>

      <!-- Original STACKED layout for LONG tasks (>= 0.8h) -->
      <template v-else-if="(task.durationHours || 1) >= 0.8">
        <div class="flex items-center gap-2.5 shrink-0 opacity-90">
          <Badge variant="secondary" class="text-[10px] font-bold uppercase tracking-wider py-0 h-5 px-2 rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 border-none shadow-none">
            {{ task.category }}
          </Badge>
          <span class="text-xs font-mono font-medium text-zinc-400 tracking-tight">{{ task.time }} — {{ task.duration }}</span>
        </div>
        <h3 
          class="text-base md:text-lg font-bold tracking-tight transition-transform duration-300 shrink-0 truncate leading-tight"
          :class="!task.completed ? 'text-zinc-900 dark:text-zinc-50 group-hover/task:translate-x-1' : 'line-through text-zinc-500'"
        >
          {{ task.title }}
        </h3>
        <p v-if="task.description && (task.durationHours || 1) >= 1.2" class="text-xs text-zinc-500 font-medium leading-relaxed max-w-2xl line-clamp-2 mt-0.5">
          {{ task.description }}
        </p>

        <!-- Timer / Progress for LONG tasks -->
        <div v-if="task.type === 'task' && !task.completed" class="mt-auto flex items-center justify-between gap-4">
            <div v-if="isRunning" class="flex items-center gap-2">
                <Timer class="w-3.5 h-3.5 text-primary animate-pulse" />
                <span class="text-xs font-mono font-bold" :class="isOvertime ? 'text-destructive' : 'text-primary'">
                    {{ displayTime }}
                    <span v-if="isOvertime" class="ml-1 text-[10px] animate-bounce tracking-widest">(超时)</span>
                </span>
            </div>
            <div class="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    v-if="!isRunning" 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-3 text-xs gap-1.5 hover:bg-primary hover:text-white rounded-lg font-medium bg-zinc-50 dark:bg-zinc-800"
                    @click.stop="handleStartTask(task)"
                >
                    <Play class="w-3 h-3" /> 开始执行
                </Button>
                <Button 
                    v-else 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-3 text-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-medium"
                    @click.stop="store.openModal()"
                >
                    <Maximize2 class="w-3 h-3" /> 打开计时器
                </Button>
            </div>
        </div>
      </template>

      <!-- Minimal layout for SHORT tasks (< 0.4h) -->
      <template v-else>
        <h3 
          class="text-[11px] font-bold tracking-tight transition-transform duration-300 truncate w-full leading-none"
          :class="!task.completed ? 'text-zinc-900 dark:text-zinc-100 group-hover/task:translate-x-1' : 'line-through text-zinc-500'"
        >
          {{ task.title }}
        </h3>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, CheckCircle, Timer, Maximize2 } from 'lucide-vue-next'
import { useDayData } from '@/views/day/composables/useDayData'
import { usePomodoroStore } from '@/stores/pomodoroStore'

const props = defineProps({
  task: Object,
  index: Number
})

const emit = defineEmits(['select', 'edit'])

const computedStyle = computed(() => {
  const col = props.task._col || 0
  const numCols = props.task._numCols || 1
  
  const style = {
    top: `calc(${props.task.startHour} * var(--hour-height))`,
    height: `calc(${props.task.durationHours || 1} * var(--hour-height))`,
    minHeight: '28px',
    zIndex: col + 10
  }
  
  if (numCols > 1) {
    style.width = `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`
    style.left = `calc(var(--timeline-left) + ((100% - var(--timeline-left)) / ${numCols}) * ${col})`
  } else {
    style.left = `var(--timeline-left)`
    style.right = `0`
  }
  
  return style
})

const { handleStartTask, handleToggleComplete } = useDayData()
const store = usePomodoroStore()

const isRunning = computed(() => !!props.task.actual_start_time && !props.task.actual_end_time && !props.task.completed)
const isStoreActive = computed(() => store.activeTask?.id === props.task.id)

const displayTime = computed(() => isStoreActive.value ? store.formattedTime : '00:00')

const isOvertime = computed(() => {
    if (!isRunning.value) return false
    const scheduledMins = props.task.original?.duration || props.task.duration || 30
    const elapsed = isStoreActive.value ? store.elapsedSeconds : 0
    return elapsed > scheduledMins * 60
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
