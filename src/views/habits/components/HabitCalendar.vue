<template>
  <Card class="border flex flex-col relative shadow-sm rounded-xl overflow-hidden bg-background shrink-0">
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
/**
 * 习惯日历展示组件 (HabitCalendar.vue)
 *
 * 功能说明：
 *   - 以网格形式展示当月日历，包含星期表头和日期格子
 *   - 支持切换查看上/下月份的日历数据
 *   - 根据 completedDays 属性，高亮标记已完成打卡的日期
 *   - 今日（当前系统日期）会有特殊边框样式突出显示
 *   - 支持点击任意日期格子触发 toggle-complete 事件，用于记录/取消打卡
 *
 * 使用方式：
 *   - 通过 props.completedDays 传入已打卡日期数组，如 [1, 15, 23]
 *   - 监听 @toggle-complete 事件获取点击的日期，执行打卡逻辑
 *   - 监听 @month-changed 事件获取切换后的年月，用于加载对应数据
 *
 * 依赖组件：
 *   - Card, CardContent, CardHeader, CardTitle（shadcn/ui）
 *   - Button（shadcn/ui）
 *   - ChevronLeft, ChevronRight（lucide-vue-next 图标）
 *
 * 核心逻辑：
 *   - 使用 useHabitCalendar composable 处理日历状态（年月、网格数据、翻页等）
 *   - calendarGrid 返回包含 null（空白格子）和日期数字的数组，用于渲染网格
 *   - isToday() 判断某日期是否为今日，用于应用特殊样式
 *
 * @property {number[]} completedDays - 已完成打卡的日期数组（每月1~31之间的数字）
 * @emits {toggle-complete} - 用户点击日期格子时触发，传递日期数字
 * @emits {month-changed} - 用户切换月份时触发，传递 { year, month } 对象
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