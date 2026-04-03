<script setup>
/**
 * 习惯页面头部组件 (HabitHeader.vue)
 * 显示当前选中习惯的标题。
 */
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<template>
  <header class="flex flex-col gap-2 mb-2">
    <h3 class="text-3xl font-bold tracking-tight text-foreground">{{ title }}</h3>
  </header>
</template>
