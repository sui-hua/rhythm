<template>
  <section class="rounded-3xl border border-border bg-card px-5 py-4">
    <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ subtitle }}</p>
  </section>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '当前页面' },
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
})
</script>
