<template>
  <div
    :id="'task-' + index"
    class="absolute left-2 sm:left-20 md:left-32 right-0 transition-all duration-700 cursor-pointer select-none"
    :style="{ top: `calc(${task.startHour} * var(--hour-height))`, height: `calc(${task.durationHours} * var(--hour-height))`, minHeight: '28px' }"
    @click="$emit('select', index)"
    @dblclick="$emit('edit', index)"
  >
    <div 
      class="flex h-full border border-border border-l-4 border-l-primary pl-6 pr-4 overflow-hidden bg-background shadow-sm transition-all duration-300 rounded-r-xl group"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-col justify-center py-0.5 px-3 min-h-[28px]' : 
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2' : 'flex-col py-4 gap-2',
        task.completed ? 'opacity-40 grayscale scale-[0.98]' : 'hover:-translate-x-1 hover:shadow-md',
        isRunning ? 'ring-2 ring-primary/20 bg-primary/5' : ''
      ]"
    >
      <!-- Title for MEDIUM tasks - Simple mode -->
      <template v-if="(task.durationHours || 1) >= 0.4 && (task.durationHours || 1) < 0.8">
        <h3 
          class="flex-1 text-xs md:text-sm font-semibold tracking-tight transition-transform duration-300 truncate"
          :class="!task.completed ? 'hover:translate-x-2' : ''"
        >
          {{ task.title }}
        </h3>
      </template>

      <!-- Original STACKED layout for LONG tasks (>= 0.8h) -->
      <template v-else-if="(task.durationHours || 1) >= 0.8">
        <div class="flex items-center gap-3 shrink-0">
          <Badge variant="outline" class="text-[9px] font-bold uppercase tracking-wider py-0 h-4 rounded-md">
            {{ task.category }}
          </Badge>
          <span class="text-[10px] font-mono font-medium text-muted-foreground/50 tracking-tight">{{ task.time }} — {{ task.duration }}</span>
        </div>
        <h3 
          class="text-base md:text-lg font-bold tracking-tight transition-transform duration-300 shrink-0 truncate leading-tight"
          :class="!task.completed ? 'hover:translate-x-2' : 'line-through text-muted-foreground'"
        >
          {{ task.title }}
        </h3>
        <p v-if="(task.durationHours || 1) >= 1.2" class="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl line-clamp-2 border-l-2 pl-3">
          {{ task.description }}
        </p>

        <!-- Timer / Progress for LONG tasks -->
        <div v-if="task.type === 'task' && !task.completed" class="mt-auto flex items-center justify-between gap-4">
            <div v-if="isRunning" class="flex items-center gap-2">
                <Timer class="w-3 h-3 text-primary animate-pulse" />
                <span class="text-xs font-mono font-bold" :class="isOvertime ? 'text-destructive' : 'text-primary'">
                    {{ formattedTime }}
                    <span v-if="isOvertime" class="ml-1 text-[10px] animate-bounce">(超时)</span>
                </span>
            </div>
            <div class="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    v-if="!isRunning" 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-2 text-xs gap-1 hover:bg-primary hover:text-white"
                    @click.stop="handleStartTask(task)"
                >
                    <Play class="w-3 h-3" /> 开始执行
                </Button>
                <Button 
                    v-else 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-2 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    @click.stop="handleToggleComplete(task)"
                >
                    <CheckCircle class="w-3 h-3" /> 完成并记录
                </Button>
            </div>
        </div>
      </template>

      <!-- Minimal layout for SHORT tasks (< 0.4h) -->
      <template v-else>
        <h3 
          class="text-[10px] md:text-[11px] font-bold tracking-tight transition-transform duration-300 truncate w-full leading-none"
          :class="!task.completed ? 'hover:translate-x-2' : 'line-through text-muted-foreground'"
        >
          {{ task.title }}
        </h3>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, CheckCircle, Timer } from 'lucide-vue-next'
import { useTaskTimer } from '@/composables/useTaskTimer'
import { useDayData } from '@/views/day/composables/useDayData'

const props = defineProps({
  task: Object,
  index: Number
})

const emit = defineEmits(['select', 'edit'])

const { handleStartTask, handleToggleComplete } = useDayData()
const { elapsedSeconds, formattedTime, start, stop } = useTaskTimer()

const isRunning = computed(() => !!props.task.actual_start_time && !props.task.actual_end_time && !props.task.completed)
const isOvertime = computed(() => {
    if (!isRunning.value) return false
    const scheduledMins = props.task.original?.duration || 30
    return elapsedSeconds.value > scheduledMins * 60
})

watch(() => props.task.actual_start_time, (newVal) => {
    if (newVal && !props.task.actual_end_time && !props.task.completed) {
        start(newVal)
    } else {
        stop()
    }
}, { immediate: true })

watch(() => props.task.completed, (newVal) => {
    if (newVal) stop()
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
