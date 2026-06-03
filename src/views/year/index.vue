<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <YearGrid
      :year-data="yearData"
      @enter-month="enterMonth"
    />
  </div>
</template>

<script setup>
import { useYearView } from '@/views/year/composables/useYearView'
import YearGrid from '@/views/year/components/YearGrid.vue'

const { yearData, enterMonth } = useYearView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
