<template>
  <div
      :id="'task-' + index"
      class="absolute left-32 right-0 transition-all duration-700 group cursor-pointer select-none"
      :style="{ top: (task.startHour * 25) + 'vh', height: (task.durationHours * 25) + 'vh' }"
      @click="$emit('select', index)"
      @dblclick="$emit('edit', index)"
  >
    <div 
      class="flex h-full border-l-4 border-primary pl-6 pr-4 overflow-hidden bg-background shadow-sm border border-border transition-all duration-300 rounded-r-xl"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-col justify-center py-1' : 
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2' : 'flex-col py-4 gap-2',
        task.completed ? 'opacity-40 grayscale scale-[0.98]' : 'hover:-translate-x-1 hover:shadow-md'
      ]"
    >
      <!-- Title for MEDIUM tasks - Simple mode -->
      <template v-if="(task.durationHours || 1) >= 0.4 && (task.durationHours || 1) < 0.8">
        <h3 
          class="flex-1 text-sm font-semibold tracking-tight transition-transform duration-300 truncate"
          :class="[!task.completed ? 'group-hover:translate-x-2' : '']"
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
          class="text-lg font-bold tracking-tight transition-transform duration-300 shrink-0 truncate leading-tight"
          :class="[!task.completed ? 'group-hover:translate-x-2' : 'line-through text-muted-foreground']"
        >
          {{ task.title }}
        </h3>
        <p v-if="(task.durationHours || 1) >= 1.2" class="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl line-clamp-2 border-l-2 pl-3">
          {{ task.description }}
        </p>
      </template>

      <!-- Minimal layout for SHORT tasks (< 0.4h) -->
      <template v-else>
        <h3 
          class="text-xs font-semibold tracking-tight transition-transform duration-300 truncate w-full"
          :class="[!task.completed ? 'group-hover:translate-x-2' : 'line-through text-muted-foreground']"
        >
          {{ task.title }}
        </h3>
      </template>
    </div>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  task: Object,
  index: Number
})

defineEmits(['select', 'edit'])
</script>
