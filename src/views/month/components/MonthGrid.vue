<template>
  <div class="flex-1 flex flex-col">
    <div class="grid grid-cols-7 border-b border-border bg-muted/50 shrink-0">
      <div v-for="w in weekdays" :key="w" class="py-3 text-center text-[10px] font-black text-muted-foreground/70 tracking-[0.2em]">{{ w }}</div>
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

<script lang="ts" setup>
/**
 * MonthGrid.vue - 月度日历网格组件
 *
 * 功能说明：
 * - 渲染月历视图的日历网格，包含星期头部和日期单元格
 * - 使用 7 列网格布局（周一至周日），auto-rows-fr 自适应行高
 * - 星期头部固定在顶部，日期区域 flex-1 占满剩余空间
 *
 * 组件结构：
 * - 顶部：星期标题栏（周一~周日），浅灰背景，字母间距加宽
 * - 主体：DayCell 组成的 7 列网格，每行代表一周
 *
 * 使用方式：
 * // &lt;MonthGrid :month-grid-data="monthGridData" @enter-day="handleEnterDay" /&gt;
 *
 * @prop {DayData[]} monthGridData - 月度网格数据
 * @emit {Date} enterDay - 用户点击进入某日详情
 */
import DayCell from '@/views/month/components/DayCell.vue'

/** 日期单元格数据结构，与 DayCell props 保持一致 */
interface DayData {
  date: string | number
  isCurrent: boolean
  tasks?: any[]
  taskHours?: number[]
  /** 当日目标计划数量 */
  goalCount?: number
  /** 当日习惯打卡次数 */
  habitCount?: number
}

// 星期标题，一周七天从周一到周日（中文）
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 接收父组件传入的月度网格数据，用于渲染每日单元格
defineProps<{
  monthGridData: DayData[]
}>()

// 向上传递用户进入某日详情的事件
defineEmits(['enterDay'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
