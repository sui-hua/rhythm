<script setup>
/**
 * 习惯统计数据看板组件 (HabitStats.vue)
 * 用以展示一行多个小的统计指标格子（例如连击、完成率等）。
 */
defineProps({
  /**
   * 包含具体统计项目数据的数组。
   * 格式约束要求：[{ label: '标题', value: '数值', unit: '单位后缀' }, ...]
   */
  stats: {
    type: Array,
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
