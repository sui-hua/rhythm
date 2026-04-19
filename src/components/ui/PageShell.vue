<template>
  <div class="mx-auto w-full" :style="{ maxWidth: uiGrammar.page.maxWidth, padding: uiGrammar.page.padding }">
    <slot />
  </div>
</template>

<script setup>
import { uiGrammar } from '@/config/uiGrammar'
</script>
