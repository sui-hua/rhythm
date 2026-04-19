<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[320] bg-black/45">
      <div class="mx-auto mt-20 max-w-md rounded-3xl bg-background p-6 shadow-2xl">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">首次引导</p>
        <h2 class="mt-2 text-xl font-semibold text-foreground">{{ title }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ description }}</p>
        <div class="mt-6 flex gap-3">
          <button class="rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background" @click="$emit('complete')">完成这一步</button>
          <button class="rounded-2xl border border-border px-4 py-2 text-sm font-medium" @click="$emit('close')">稍后再说</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' }
})
defineEmits(['complete', 'close'])
</script>
