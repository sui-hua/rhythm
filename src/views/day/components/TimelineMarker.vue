<template>
  <div class="marker" :style="{ top: (currentHour * 25) + 'vh' }">
    <div class="marker__dots">
      <div class="marker__dot-ping"></div>
      <div class="marker__dot-solid"></div>
    </div>
    <Badge variant="outline" class="marker__label">
      现在
    </Badge>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  currentHour: Number
})
</script>

<style scoped>
@reference "@/assets/main.css";
.marker {
  @apply absolute left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent z-50 flex items-center pointer-events-none transition-all duration-500 animate-pulse;
}
.marker__dots {
  @apply relative flex items-center;
}
.marker__dot-ping {
  @apply w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full -ml-2 shadow-2xl shadow-red-500/60 ring-4 ring-red-500/20 animate-ping absolute;
}
.marker__dot-solid {
  @apply w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full -ml-2 shadow-2xl shadow-red-500/60 ring-2 ring-background relative z-10;
}
.marker__label {
  @apply ml-8 text-[9px] font-black text-red-600 uppercase tracking-[0.3em] border-red-200 bg-red-50/80 backdrop-blur-sm px-2 py-0.5 shadow-sm;
}
.marker__label:hover {
  @apply bg-red-50;
}
</style>