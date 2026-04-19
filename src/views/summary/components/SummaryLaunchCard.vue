<template>
  <button class="rounded-3xl border border-border bg-card px-4 py-4 text-left" @click="$emit('launch')">
    <p class="text-sm font-semibold text-foreground">{{ title }}</p>
    <p class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
  </button>
</template>

<script setup>
defineProps({
  title: { type: String, default: '发起今日总结' },
  description: { type: String, default: '从今天的执行记录里提取内容' }
})
defineEmits(['launch'])
</script>
