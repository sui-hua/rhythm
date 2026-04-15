<!--
  单条归档记录 (ArchiveItem.vue)
  展示日期圆点和任务卡片，支持内联编辑任务标题、时间和时长。
-->
<script setup>
/**
 * 归档项组件 (ArchiveItem.vue)
 * 显示单个日期的任务信息，支持内联编辑。
 */
defineProps({
  /**
   * 日期数字
   */
  day: {
    type: Number,
    required: true
  },
  /**
   * 任务数据
   */
  task: {
    type: Object,
    default: null
  },
  /**
   * 日期任务键名
   */
  taskKey: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update-task'])

// 二元签名：handleUpdateTask(task, payload)
const handleUpdateTask = (task, payload) => {
  emit('update-task', task, payload)
}
</script>

<template>
  <div class="archive-item">
    <div class="archive-item-row">
      <div class="archive-dot"></div>
      <span class="archive-day">{{ String(day).padStart(2, '0') }}</span>

      <div v-if="task" class="archive-card">
        <input
          class="archive-input"
          :value="task.title"
          @change="(e) => handleUpdateTask(task, { title: e.target.value })"
        />

        <div class="archive-meta">
          <div class="archive-meta-item">
            <span class="archive-meta-label">时间</span>
            <input
              type="time"
              class="archive-time-input"
              :value="task.task_time ? task.task_time.slice(0, 5) : ''"
              @change="(e) => handleUpdateTask(task, { task_time: e.target.value || null })"
            />
          </div>
          <div class="archive-meta-item">
            <span class="archive-meta-label">时长</span>
            <div class="archive-duration">
              <input
                type="number"
                class="archive-duration-input"
                :value="task.duration"
                @change="(e) => handleUpdateTask(task, { duration: e.target.value ? parseInt(e.target.value) : null })"
              />
              <span class="archive-duration-unit">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/tw-theme.css";

.archive-item {
  @apply pl-20 pb-6 last:pb-0;
}

.archive-item-row {
  @apply flex items-center gap-3 relative;
}

.archive-dot {
  @apply absolute left-[-25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-white transition-colors z-10;
}

.archive-day {
  @apply text-xs font-bold font-mono text-muted-foreground/50 uppercase tracking-widest transition-colors w-10 text-right shrink-0;
}

.archive-card {
  @apply min-h-[50px] flex-1 rounded-xl border border-zinc-100 bg-white p-3 text-sm font-medium tracking-tight leading-relaxed text-foreground shadow-sm hover:shadow-md transition-all flex flex-col gap-2;
}

.archive-item:hover .archive-dot {
  @apply bg-primary;
}

.archive-item:hover .archive-day {
  @apply text-primary;
}

.archive-item:hover .archive-card {
  @apply border-zinc-200;
}

.archive-input {
  @apply font-medium bg-transparent border-none outline-none w-full;
}

.archive-meta {
  @apply flex items-center gap-4 border-t border-zinc-50 pt-2;
}

.archive-meta-item {
  @apply flex items-center gap-2;
}

.archive-meta-label {
  @apply text-[10px] text-muted-foreground uppercase tracking-wider font-bold;
}

.archive-time-input {
  @apply text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[60px];
}

.archive-duration {
  @apply flex items-center;
}

.archive-duration-input {
  @apply text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[40px] text-right;
}

.archive-duration-unit {
  @apply text-xs text-muted-foreground font-mono ml-1;
}
</style>
