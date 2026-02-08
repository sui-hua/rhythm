<script setup>
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'

defineProps({
  selectedMonth: {
    type: Number,
    default: null
  },
  months: {
    type: Array,
    required: true
  },
  sortedSelectedDates: {
    type: Array,
    required: true
  },
  dailyTasks: {
    type: Object,
    required: true
  },
  dayTaskKey: {
    type: Function,
    required: true
  }
})

const autoGrow = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = e.target.scrollHeight + 'px'
}
</script>

<template>
  <div class="flex-1 bg-background flex flex-col overflow-hidden">
    <header class="p-6 md:p-10 border-b">
      <div class="flex justify-between items-end">
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 block">任务归档</span>
          <h3 class="text-3xl font-bold tracking-tight text-foreground leading-none">
            {{ selectedMonth ? months[selectedMonth-1].full : '无内容' }}
          </h3>
        </div>
        <div class="text-right flex flex-col items-end gap-1">
          <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">周期密度</p>
          <div class="text-lg font-bold tracking-tight">
            {{ sortedSelectedDates.length }}
            <span class="text-xs text-muted-foreground font-medium ml-0.5">/ 31</span>
          </div>
        </div>
      </div>
    </header>

    <ScrollArea class="flex-1 px-6 md:px-10 py-6 pb-32">
      <div v-if="sortedSelectedDates.length > 0" class="flex flex-col gap-6">
        <TransitionGroup name="task-list">
          <div v-for="day in sortedSelectedDates" :key="day" class="flex items-start gap-8 group">
            <span class="text-3xl font-bold tracking-tighter text-muted-foreground/30 group-hover:text-primary transition-colors w-12 pt-1 shrink-0">
              {{ String(day).padStart(2, '0') }}
            </span>

            <div class="flex-1">
              <textarea
                  v-model="dailyTasks[dayTaskKey(day)]"
                  rows="2"
                  class="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-medium tracking-tight leading-relaxed resize-none text-foreground"
                  placeholder="请输入任务详情..."
              ></textarea>
              <div class="flex justify-between mt-2 px-1">
                <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">已确认任务</span>
                <span class="text-[9px] font-mono font-medium text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity uppercase">任务索引_{{ day }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <div v-else class="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl bg-zinc-50/50">
        <p class="text-sm text-muted-foreground">暂无归档内容，请先在下方日期面板中规划任务。</p>
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
