<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm daily-report-backdrop" @click="$emit('close')"></div>
    <div v-if="show" class="fixed inset-0 z-[301] flex items-center justify-center px-4">
      <div class="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6 daily-report-panel">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold">每日日报</h2>
            <p class="text-xs text-muted-foreground mt-1">昨天复盘 · 今天计划</p>
          </div>
          <button class="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-50" @click="$emit('close')" aria-label="关闭">
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-xl border border-border p-4">
            <p class="text-xs text-muted-foreground">昨天已完成</p>
            <p class="text-2xl font-semibold mt-2">{{ stats.yesterdayCompleted }}</p>
          </div>
          <div class="rounded-xl border border-border p-4">
            <p class="text-xs text-muted-foreground">昨天未完成</p>
            <p class="text-2xl font-semibold mt-2">{{ stats.yesterdayUncompleted }}</p>
          </div>
          <div class="rounded-xl border border-border p-4">
            <p class="text-xs text-muted-foreground">今日任务数</p>
            <p class="text-2xl font-semibold mt-2">{{ stats.todayTotal }}</p>
          </div>
          <div class="rounded-xl border border-border p-4">
            <p class="text-xs text-muted-foreground">顺延到今天</p>
            <p class="text-2xl font-semibold mt-2">{{ stats.carryoverToToday }}</p>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-2">
          <button class="w-full h-10 rounded-lg bg-foreground text-background font-medium" @click="$emit('confirm-carryover')">确认转移到今天</button>
          <button class="w-full h-10 rounded-lg border border-border text-foreground font-medium hover:bg-zinc-50" @click="$emit('confirm')">知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  stats: {
    type: Object,
    default: () => ({
      yesterdayCompleted: 0,
      yesterdayUncompleted: 0,
      todayTotal: 0,
      carryoverToToday: 0
    })
  }
})

defineEmits(['close', 'confirm', 'confirm-carryover'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.daily-report-backdrop {
  animation: daily-report-fade 200ms ease-out;
}

.daily-report-panel {
  animation: daily-report-pop 240ms ease-out;
}

@keyframes daily-report-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes daily-report-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
