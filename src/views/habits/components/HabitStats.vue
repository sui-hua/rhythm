<script lang="ts" setup>
import type { StatItem } from '@/views/habits/composables/useHabitStats'

defineProps({
  stats: {
    type: Array as () => StatItem[],
    required: true
  }
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
    <div v-for="stat in stats" :key="stat.label" 
         class="bg-background p-4 rounded-xl border flex flex-col justify-center gap-1 shadow-sm">
      <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{{ stat.label }}</span>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight">{{ stat.value }}</span>
        <span class="text-[10px] font-medium text-muted-foreground">{{ stat.unit }}</span>
      </div>
    </div>
  </div>
</template>
