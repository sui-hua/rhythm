<script lang="ts" setup>
defineProps({
  day: {
    type: Number,
    required: true
  },
  task: {
    type: Object,
    default: null
  },
  taskKey: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update-task'])

// 二元签名：handleUpdateTask(task, payload)
const handleUpdateTask = (task: any, payload: any) => {
  emit('update-task', task, payload)
}
</script>

<template>
  <div class="pl-20 pb-6 last:pb-0 group/item">
    <div class="flex items-center gap-3 relative">
      <div class="absolute left-[-25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-white transition-colors z-10 group-hover/item:bg-primary"></div>
      <span class="text-xs font-bold font-mono text-muted-foreground/50 uppercase tracking-widest transition-colors w-10 text-right shrink-0 group-hover/item:text-primary">{{ String(day).padStart(2, '0') }}</span>

      <div v-if="task" class="min-h-[50px] flex-1 rounded-xl border border-border bg-card p-3 text-sm font-medium tracking-tight leading-relaxed text-foreground shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group-hover/item:border-zinc-200">
        <input
          class="font-medium bg-transparent border-none outline-none w-full"
          :value="task.title"
          @change="(e) => handleUpdateTask(task, { title: (e.target as HTMLInputElement).value })"
        />

        <div class="flex items-center gap-4 border-t border-zinc-50 pt-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时间</span>
            <input
              type="time"
              class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[60px]"
              :value="task.task_time ? task.task_time.slice(0, 5) : ''"
              @change="(e) => handleUpdateTask(task, { task_time: (e.target as HTMLInputElement).value || null })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时长</span>
            <div class="flex items-center">
              <input
                type="number"
                class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[40px] text-right"
                :value="task.duration"
                @change="(e) => handleUpdateTask(task, { duration: (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : null })"
              />
              <span class="text-xs text-muted-foreground font-mono ml-1">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
