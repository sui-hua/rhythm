<template>
  <div class="h-full w-full bg-zinc-100 overflow-hidden">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full h-full gap-px">
      <MonthCell
        v-for="month in yearData"
        :key="month.name"
        :month="month"
        @enter-month="$emit('enterMonth', month)"
      />
    </div>
  </div>
</template>

<script setup>
import MonthCell from '@/views/year/components/MonthCell.vue'

defineProps({
  yearData: Array
})

defineEmits(['enterMonth'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
