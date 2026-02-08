<script setup>
import { ArrowUpRight } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'

defineProps({
  logs: {
    type: Array,
    default: () => [1, 2, 3]
  }
})
</script>

<template>
  <div class="pb-20 pt-6">
    <div class="flex flex-col gap-2 mb-8 items-center text-center">
      <h3 class="text-lg font-bold tracking-tight">往日日志</h3>
      <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">“坚持胜过爆发”</p>
    </div>

    <div class="flex flex-col gap-4">
      <Card v-for="i in logs" :key="i"
           class="group cursor-pointer transition-all border shadow-sm rounded-xl hover:translate-x-1 duration-300">
        <CardContent class="p-4 flex items-center gap-6">
          <div class="shrink-0 flex flex-col border-r pr-6 gap-1">
            <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">0{{i}} / 一月</span>
            <span class="text-sm font-bold tracking-tight">日志</span>
          </div>
          <p class="flex-1 text-sm font-medium tracking-tight text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed">
            今天坚持完成了预定的习惯，感觉精力和专注度都有明显提升。记录下此刻的成就感。
          </p>
          <div class="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowUpRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
