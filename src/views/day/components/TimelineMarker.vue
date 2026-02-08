<template>
  <div
      class="absolute left-0 right-0 h-px bg-red-500 z-50 flex items-center pointer-events-none transition-all duration-500"
      :style="{ top: (currentHour * 25) + 'vh' }"
  >
    <div class="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-xl shadow-red-500/50"></div>
    <Badge variant="outline" class="ml-6 text-[10px] font-black text-red-500 uppercase tracking-[0.5em] border-none bg-transparent hover:bg-transparent px-0">
      Timeline Live
    </Badge>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  currentHour: Number
})
</script>