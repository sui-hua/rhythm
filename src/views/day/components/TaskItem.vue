<template>
  <div
    :id="'task-' + index"
    class="absolute left-2 sm:left-20 md:left-32 right-0 transition-all duration-700 cursor-pointer select-none"
    :style="{ top: `calc(${task.startHour} * var(--hour-height))`, height: `calc(${task.durationHours} * var(--hour-height))`, minHeight: '28px' }"
    @click="$emit('select', index)"
    @dblclick="$emit('edit', index)"
  >
    <div 
      class="flex h-full border border-zinc-100/80 dark:border-white/5 pl-4 pr-1 overflow-hidden transition-all duration-500 rounded-2xl group shadow-(--shadow-whisper)"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-col justify-center py-0.5 min-h-[28px]' : 
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2' : 'flex-col py-4 gap-2',
        task.completed ? 'opacity-30 grayscale scale-[0.97] shadow-none bg-zinc-50/50! dark:bg-zinc-900/50!' : 'bg-white dark:bg-zinc-900 hover:-translate-x-1 hover:scale-[1.01] hover:shadow-(--shadow-elevated)',
        isRunning ? 'ring-2 ring-primary bg-primary/5' : ''
      ]"
    >
      <div 
        class="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500"
        :class="[
          task.completed ? 'bg-zinc-300' : 'bg-primary'
        ]"
      ></div>
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
                    {{ displayTime }}
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
