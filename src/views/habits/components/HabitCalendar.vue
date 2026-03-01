<template>
  <Card class="border flex flex-col relative shadow-sm rounded-xl overflow-hidden bg-background shrink-0">
    <CardHeader class="flex flex-row justify-between items-center py-3 px-6 shrink-0 border-b bg-zinc-50/30">
      <div class="flex flex-col gap-0.5">
        <CardTitle class="text-base font-bold tracking-tight">{{ monthName }}</CardTitle>
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" @click="handlePrevMonth" class="w-7 h-7 rounded-md hover:bg-background transition-colors shadow-sm border"><ChevronLeft class="w-3 h-3" /></Button>
        <Button variant="ghost" size="icon" @click="handleNextMonth" class="w-7 h-7 rounded-md hover:bg-background transition-colors shadow-sm border"><ChevronRight class="w-3 h-3" /></Button>
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
                   : isToday(day)
                     ? 'border-primary shadow-sm hover:bg-primary/20 ring-1 ring-primary ring-offset-1'
                     : 'bg-accent/5 hover:bg-zinc-100 border-zinc-200/50 hover:border-primary/30'
               ]"
               @click="$emit('toggle-complete', day)">
            <span class="text-[11px] font-bold transition-transform group-active:scale-90"
                  :class="[
                    completedDays.includes(day) 
                      ? 'text-primary-foreground' 
                      : isToday(day)
                        ? 'text-primary font-black'
                        : 'text-muted-foreground'
                  ]">
              {{ day }}
            </span>
          </div>
          <div v-else class="w-11 h-11"></div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName as formatMonth } from '@/utils/dateFormatter'

const dateStore = useDateStore()

const props = defineProps({
  completedDays: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toggle-complete', 'month-changed'])

// 独立维护日历中查阅的年份与月份
const viewYear = ref(dateStore.currentDate.getFullYear())
const viewMonth = ref(dateStore.currentDate.getMonth())

// 用于展示对应的月份
const monthName = computed(() => {
  return formatMonth(viewMonth.value + 1, 'zh')
})

// 根据 viewYear 和 viewMonth 动态计算要展示的网格
const calendarGrid = computed(() => {
  const year = viewYear.value;
  const month = viewMonth.value;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);
  return grid;
})

const handlePrevMonth = () => {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
  emitMonthChange()
}

const handleNextMonth = () => {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
  emitMonthChange()
}

const emitMonthChange = () => {
  emit('month-changed', { year: viewYear.value, month: viewMonth.value })
}

// 指示哪一天是“今天”
const isToday = (day) => {
  const now = new Date()
  return (
    now.getFullYear() === viewYear.value && 
    now.getMonth() === viewMonth.value && 
    now.getDate() === day
  )
}

onMounted(() => {
  // 组件初次挂载时将当前时间上报给父组件以备数据同步
  emitMonthChange()
})

</script>