<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <div class="fixed inset-0 z-[90] h-full w-full bg-background flex flex-col">
      <MonthGrid
        :month-grid-data="monthGridData"
        @enter-day="enterDay"
      />
    </div>
  </div>
</template>

<script setup>
import { useMonthView } from '@/views/month/composables/useMonthView'
import MonthGrid from '@/views/month/components/MonthGrid.vue'

const { monthGridData, enterDay } = useMonthView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
