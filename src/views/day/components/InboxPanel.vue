<template>
  <section class="rounded-3xl border border-border bg-card p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">待安排</h3>
      <span class="text-xs text-muted-foreground">{{ items.length }} 项</span>
    </div>
    <button
      v-for="item in items"
      :key="item.id"
      class="mt-3 block w-full rounded-2xl bg-secondary px-3 py-3 text-left text-sm"
      @click="$emit('schedule', item)"
    >
      {{ item.title }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})
defineEmits(['schedule'])
</script>
