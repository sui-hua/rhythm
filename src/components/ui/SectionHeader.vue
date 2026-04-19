<template>
  <header class="space-y-2">
    <p class="text-[11px] font-bold uppercase text-muted-foreground" :style="{ letterSpacing: uiGrammar.section.eyebrowTracking }">{{ eyebrow }}</p>
    <h2 class="text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h2>
    <p v-if="description" class="text-sm leading-6 text-muted-foreground">{{ description }}</p>
  </header>
</template>

<script setup>
import { uiGrammar } from '@/config/uiGrammar'

defineProps({
  eyebrow: String,
  title: String,
  description: String
})
</script>
