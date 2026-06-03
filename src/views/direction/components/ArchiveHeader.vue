<script setup>
defineProps({
  monthName: {
    type: String,
    default: '无内容'
  },
  taskCount: {
    type: Number,
    default: 0
  },
  months: {
    type: Array,
    required: true
  },
  selectedMonth: {
    type: Number,
    default: null
  }
})
</script>

<template>
  <header class="archive-header">
    <div class="archive-header-left">
      <span class="archive-caption">任务归档</span>
      <h3 class="archive-title">{{ monthName }}</h3>
    </div>
    <div class="archive-header-right">
      <p class="archive-density-label">周期密度</p>
      <div class="archive-density-value">
        {{ taskCount }}
        <span class="archive-density-total">/ 31</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
@reference "@/assets/tw-theme.css";

.archive-header {
  @apply p-6 md:p-10 border-b flex justify-between items-end;
}

.archive-header-left {
  @apply flex flex-col gap-1;
}

.archive-caption {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 block;
}

.archive-title {
  @apply text-3xl font-bold tracking-tight text-foreground leading-none;
}

.archive-header-right {
  @apply text-right flex flex-col items-end gap-1;
}

.archive-density-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-widest;
}

.archive-density-value {
  @apply text-lg font-bold tracking-tight;
}

.archive-density-total {
  @apply text-xs text-muted-foreground font-medium ml-0.5;
}
</style>
