<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
      <div v-for="w in ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']" :key="w" class="py-3 text-center text-[10px] font-black text-zinc-300 tracking-[0.2em]">{{ w }}</div>
    </div>
    <div class="flex-1 grid grid-cols-7 auto-rows-1fr gap-px bg-zinc-100">
      <DayCell
        v-for="(day, idx) in monthGridData"
        :key="idx"
        :day="day"
        @enter-day="$emit('enterDay', day.date)"
      />
    </div>
  </div>
</template>

<script setup>
import DayCell from './DayCell.vue'

defineProps({
  monthGridData: Array
})

defineEmits(['enterDay'])
</script>