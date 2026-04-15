<template>
  <!-- 日历卡片：展示当月网格，支持月份切换和点击打卡 -->
  <Card class="border flex flex-col relative shadow-sm rounded-xl overflow-hidden bg-background shrink-0">
    <!-- 头部：月份标题 + 上/下月翻页按钮 -->
    <CardHeader class="flex flex-row justify-between items-center py-3 px-6 shrink-0 border-b bg-zinc-50/30">
      <div class="flex flex-col gap-0.5">
        <CardTitle class="text-base font-bold tracking-tight">{{ monthName }}</CardTitle>
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" @click="handlePrevMonth" class="w-7 h-7 rounded-md transition-colors duration-200 hover:bg-zinc-200/50 shadow-sm border"><ChevronLeft class="w-3 h-3 text-muted-foreground" /></Button>
        <Button variant="ghost" size="icon" @click="handleNextMonth" class="w-7 h-7 rounded-md transition-colors duration-200 hover:bg-zinc-200/50 shadow-sm border"><ChevronRight class="w-3 h-3 text-muted-foreground" /></Button>
      </div>
    </CardHeader>

    <CardContent class="p-6 flex flex-col gap-6">
      <!-- 星期标题行 -->
      <div class="grid grid-cols-7 w-full px-2">
        <div v-for="w in ['一','二','三','四','五','六','日']" :key="w"
             class="text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
          {{w}}
        </div>
      </div>

      <!-- 日期网格：null 填充空白格子；已打卡日高亮；今日特殊边框；点击触发 toggle-complete -->
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
/**
 * 习惯日历展示组件 (HabitCalendar.vue)
 * 用于呈现网格状的当月日历，并在特定的日期上标绘高亮。支持前后月份翻阅以及点击特定日期抛出打卡事件。
 */
import { onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHabitCalendar } from '@/views/habits/composables/useHabitCalendar'

const props = defineProps({
  /**
   * 当月每一天中，已经被判定为成功打卡了的日期数组
   * 例如 `[1, 15, 23]`
   */
  completedDays: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'toggle-complete', // 点击具体某一天时触发，用于向外传递日期让外部组件执行记录开/关
  'month-changed'    // 月份翻页动作触发时抛出，以便外部组件感知最新查阅的年月再拉取对应的记录
])

const {
  viewYear,
  viewMonth,
  calendarGrid,
  monthName,
  handlePrevMonth,
  handleNextMonth,
  isToday,
  emitMonthChange
} = useHabitCalendar(emit)

onMounted(() => {
  // 组件初次挂载时将当前时间上报给父组件以备数据同步
  emitMonthChange()
})
</script>