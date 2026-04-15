<template>
  <div
    class="bg-card transition-all duration-700 cursor-pointer flex flex-col p-4 relative overflow-hidden text-foreground border-r border-b border-zinc-100 h-full group sm:p-6 lg:p-8 hover:bg-zinc-50"
    @click="$emit('enterMonth', month)"
  >
    <div class="z-10 flex justify-between items-center mb-2 sm:mb-4 lg:mb-6">
      <h3 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase italic transition-transform duration-500 group-hover:translate-x-1">
        {{ month.name }}
      </h3>
      <div class="flex items-center gap-3">
        <!-- Minimal Badge -->
        <div class="flex items-center justify-center transition-colors duration-500">
          <span class="text-[11px] font-black text-zinc-300 transition-colors group-hover:text-foreground">
            {{ month.completedDays?.length || 0 }}
          </span>
        </div>
        <!-- Minimal Hover Arrow -->
        <div class="opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <ArrowUpRight class="w-4 h-4 text-zinc-300 transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </div>
    <div class="flex-1 w-full grid grid-cols-7 gap-y-1 sm:gap-y-2 lg:gap-y-4 gap-x-2 pt-2 sm:pt-4 lg:pt-6 border-t border-zinc-100 min-h-0">
      <div v-for="e in month.firstDayOffset" :key="'e'+e"></div>
      <div v-for="d in month.days" :key="d" class="flex items-center justify-center">
        <div
          class="transition-all duration-500 rounded-full"
          :class="month.completedDays?.includes(d)
            ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-foreground opacity-100'
            : 'w-1 h-1 sm:w-1.5 sm:h-1.5 bg-zinc-200 group-hover:bg-zinc-300'"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowUpRight } from 'lucide-vue-next'

defineProps({
  month: Object
})

defineEmits(['enterMonth'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
