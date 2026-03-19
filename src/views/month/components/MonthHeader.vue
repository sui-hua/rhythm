<template>
  <header class="h-24 px-12 flex items-center justify-between border-b border-zinc-100 shrink-0">
    <div class="flex items-center gap-8">
      <Button
        variant="outline"
        size="icon"
        class="w-12 h-12 rounded-full border-zinc-100 transition-all hover:bg-foreground hover:text-background hover:border-foreground"
        @click="$emit('goBack')"
      >
        <ArrowLeft class="w-6 h-6" />
      </Button>
      <h2 class="text-4xl font-black tracking-tighter uppercase italic">{{ selectedMonth?.name }} {{ year }}</h2>
    </div>
  </header>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  selectedMonth: Object,
  year: Number
})

defineEmits(['goBack'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
