<template>
  <header class="h-24 px-12 flex items-center justify-between border-b border-zinc-100 shrink-0">
    <div class="flex items-center gap-8">
      <Button 
        variant="outline" 
        size="icon"
        @click="$emit('goBack')" 
        class="w-12 h-12 rounded-full border-zinc-100 hover:bg-black hover:text-white hover:border-black transition-all"
      >
        <ArrowLeft class="w-6 h-6" />
      </Button>
      <h2 class="text-4xl font-black tracking-tighter uppercase italic">{{ selectedMonth?.name }} 2026</h2>
    </div>
  </header>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  selectedMonth: Object
})

defineEmits(['goBack'])
</script>