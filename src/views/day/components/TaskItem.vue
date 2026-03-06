<template>
  <div
      :id="'task-' + index"
      class="task-item group"
      :style="{ top: `calc(${task.startHour} * var(--hour-height))`, height: `calc(${task.durationHours} * var(--hour-height))` }"
      @click="$emit('select', index)"
      @dblclick="$emit('edit', index)"
  >
    <div 
      class="task-item__card"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'task-item__card--short' : 
        (task.durationHours || 1) < 0.8 ? 'task-item__card--medium' : 'task-item__card--long',
        task.completed ? 'task-item__card--completed' : 'task-item__card--active'
      ]"
    >
      <!-- Title for MEDIUM tasks - Simple mode -->
      <template v-if="(task.durationHours || 1) >= 0.4 && (task.durationHours || 1) < 0.8">
        <h3 
          class="task-item__title-medium"
          :class="[!task.completed ? 'task-item__title--hoverable' : '']"
        >
          {{ task.title }}
        </h3>
      </template>

      <!-- Original STACKED layout for LONG tasks (>= 0.8h) -->
      <template v-else-if="(task.durationHours || 1) >= 0.8">
        <div class="task-item__meta">
          <Badge variant="outline" class="task-item__badge">
            {{ task.category }}
          </Badge>
          <span class="task-item__time">{{ task.time }} — {{ task.duration }}</span>
        </div>
        <h3 
          class="task-item__title-long"
          :class="[!task.completed ? 'task-item__title--hoverable' : 'task-item__title--done']"
        >
          {{ task.title }}
        </h3>
        <p v-if="(task.durationHours || 1) >= 1.2" class="task-item__description">
          {{ task.description }}
        </p>
      </template>

      <!-- Minimal layout for SHORT tasks (< 0.4h) -->
      <template v-else>
        <h3 
          class="task-item__title-short"
          :class="[!task.completed ? 'task-item__title--hoverable' : 'task-item__title--done']"
        >
          {{ task.title }}
        </h3>
      </template>
    </div>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'

const props = defineProps({
  task: Object, // 单个任务的详细数据
  index: Number // 任务在列表中的索引
})

// 向父组件触发的自定义事件：单击选择任务、双击编辑任务
defineEmits(['select', 'edit'])
</script>

<style scoped>
@reference "@/assets/main.css";
.task-item {
  @apply absolute left-32 right-0 transition-all duration-700 cursor-pointer select-none;
  min-height: 28px;
}
.task-item__card {
  @apply flex h-full border-l-4 border-primary pl-6 pr-4 overflow-hidden bg-background shadow-sm border border-border transition-all duration-300 rounded-r-xl;
}
.task-item__card--short {
  @apply flex-col justify-center py-0.5 px-3 min-h-[28px];
}
.task-item__card--medium {
  @apply flex-row items-center py-2;
}
.task-item__card--long {
  @apply flex-col py-4 gap-2;
}
.task-item__card--completed {
  @apply opacity-40 grayscale scale-[0.98];
}
.task-item__card--active:hover {
  @apply -translate-x-1 shadow-md;
}
.task-item__title-medium {
  @apply flex-1 text-sm font-semibold tracking-tight transition-transform duration-300 truncate;
}
.task-item__title-long {
  @apply text-lg font-bold tracking-tight transition-transform duration-300 shrink-0 truncate leading-tight;
}
.task-item__title-short {
  @apply text-[11px] font-bold tracking-tight transition-transform duration-300 truncate w-full leading-none;
}
.task-item:hover .task-item__title--hoverable {
  @apply translate-x-2;
}
.task-item__title--done {
  @apply line-through text-muted-foreground;
}
.task-item__meta {
  @apply flex items-center gap-3 shrink-0;
}
.task-item__badge {
  @apply text-[9px] font-bold uppercase tracking-wider py-0 h-4 rounded-md;
}
.task-item__time {
  @apply text-[10px] font-mono font-medium text-muted-foreground/50 tracking-tight;
}
.task-item__description {
  @apply text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl line-clamp-2 border-l-2 pl-3;
}
</style>
