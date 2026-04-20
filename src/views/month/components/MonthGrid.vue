<template>
  <div class="flex-1 flex flex-col">
    <div class="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
      <div v-for="w in weekdays" :key="w" class="py-3 text-center text-[10px] font-black text-zinc-300 tracking-[0.2em]">{{ w }}</div>
    </div>
    <div class="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-zinc-100">
      <DayCell
        v-for="(day, idx) in monthGridData"
        :key="idx"
        :day="day"
        @enter-day="$emit('enterDay', day.date)"
      />
    </div>
  </div>
</template>

/**
 * MonthGrid.vue - 月度日历网格组件
 * 
 * 功能说明：
 * - 渲染月历视图的日历网格，包含星期头部和日期单元格
 * - 使用 7 列网格布局（周一至周日），auto-rows-fr 自适应行高
 * - 星期头部固定在顶部，日期区域 flex-1 占满剩余空间
 * 
 * 组件结构：
 * - 顶部：星期标题栏（MON~SUN），浅灰背景，字母间距加宽
 * - 主体：DayCell 组成的 7 列网格，每行代表一周
 * 
 * 使用方式：
 * <MonthGrid 
 *   :month-grid-data="monthGridData" 
 *   @enter-day="handleEnterDay" 
 * />
 * 
 * @prop {Array} monthGridData - 月度网格数据，每项包含日期和日程信息
 * @emit {Date} enterDay - 用户点击进入某日详情，payload 为该日 Date 对象
 */

<script setup>
import DayCell from '@/views/month/components/DayCell.vue'

// 星期标题，一周七天从周一到周日
const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// 接收父组件传入的月度网格数据，用于渲染每日单元格
defineProps({
  monthGridData: Array
})

// 向上传递用户进入某日详情的事件
defineEmits(['enterDay'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
