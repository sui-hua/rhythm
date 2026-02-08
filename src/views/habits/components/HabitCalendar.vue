<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

defineProps({
  monthName: {
    type: String,
    default: '一月'
  },
  calendarGrid: {
    type: Array,
    required: true
  },
  completedDays: {
    type: Array,
    required: true
  }
})

defineEmits(['toggle-complete'])
</script>

<template>
  <Card class="border flex flex-col relative shadow-sm rounded-xl overflow-hidden bg-background shrink-0">
    <CardHeader class="flex flex-row justify-between items-center py-3 px-6 shrink-0 border-b bg-zinc-50/30">
      <div class="flex flex-col gap-0.5">
        <CardTitle class="text-sm font-bold tracking-tight">{{ monthName }}</CardTitle>
        <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">打卡日历</span>
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" class="w-7 h-7 rounded-md hover:bg-background transition-colors shadow-sm border"><ChevronLeft class="w-3 h-3" /></Button>
        <Button variant="ghost" size="icon" class="w-7 h-7 rounded-md hover:bg-background transition-colors shadow-sm border"><ChevronRight class="w-3 h-3" /></Button>
      </div>
    </CardHeader>

    <CardContent class="p-6 flex flex-col gap-6">
      <div class="grid grid-cols-7 w-full px-2">
        <div v-for="w in ['一','二','三','四','五','六','日']" :key="w"
             class="text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
          {{w}}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-y-3 w-full px-2">
        <div v-for="(day, idx) in calendarGrid" :key="idx"
             class="flex justify-center items-center">
          <div v-if="day"
               class="w-11 h-11 relative flex items-center justify-center rounded-full transition-all duration-300 select-none group border cursor-pointer"
               :class="[
                 completedDays.includes(day) 
                   ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-[1.05]' 
                   : 'bg-accent/5 hover:bg-zinc-100 border-zinc-200/50 hover:border-primary/30'
               ]"
               @click="$emit('toggle-complete', day)">
            <span class="text-[11px] font-bold transition-transform group-active:scale-90"
                  :class="completedDays.includes(day) ? 'text-primary-foreground' : 'text-muted-foreground'">
              {{ day }}
            </span>
            
            <!-- Indicator dot for today -->
            <div v-if="day === 26" 
                 class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                 :class="completedDays.includes(day) ? 'bg-primary-foreground' : 'bg-primary'"></div>
          </div>
          <div v-else class="w-11 h-11"></div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
