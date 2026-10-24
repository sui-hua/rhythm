<template>
  <div
    class="bg-card transition-all duration-700 cursor-pointer flex flex-col p-4 relative overflow-hidden text-foreground border-r border-b border-border h-full group sm:p-6 lg:p-8 hover:bg-zinc-50"
    @click="$emit('enterMonth', month)"
  >
    <div class="z-10 flex justify-between items-center mb-2 sm:mb-4 lg:mb-6">
      <h3 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase italic transition-transform duration-500 group-hover:translate-x-1">
        {{ month.name }}
      </h3>
      <div class="flex items-center gap-3">
        <!-- 加载中状态指示器：显示脉动圆点 -->
        <div v-if="month.isLoading" class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse"></div>
        </div>
        <!-- Minimal Badge -->
        <div v-else class="flex items-center justify-center transition-colors duration-500">
          <span class="text-[11px] font-black text-muted-foreground/70 transition-colors group-hover:text-foreground">
            {{ month.completedDays?.length || 0 }}
          </span>
        </div>
        <!-- Minimal Hover Arrow -->
        <div class="opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <ArrowUpRight class="w-4 h-4 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </div>
    <!-- 数据加载中时热力图区域显示半透明状态 -->
    <div
      class="flex-1 w-full grid grid-cols-7 gap-y-1 sm:gap-y-2 lg:gap-y-4 gap-x-2 pt-2 sm:pt-4 lg:pt-6 border-t border-border min-h-0 transition-opacity duration-300"
      :class="month.isLoading ? 'opacity-40' : 'opacity-100'"
    >
      <div v-for="e in month.firstDayOffset" :key="'e'+e"></div>
      <div v-for="d in month.days" :key="d" class="flex items-center justify-center">
        <div
          class="transition-all duration-500 rounded-full"
          :class="month.completedDays?.includes(d)
            ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-foreground opacity-100'
            : 'w-1 h-1 sm:w-1.5 sm:h-1.5 bg-zinc-200 group-hover:bg-zinc-300'"
        ></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
/**
 * MonthCell.vue - 年度视图月份单元格组件
 *
 * 功能说明：
 * - 在年度概览页面中渲染单个月份的卡片
 * - 显示月份名称、已完成天数统计、日期热力网格
 * - 支持悬停交互动画和点击进入月份详情
 *
 * 接收的 props：
 * - month: MonthData - 包含以下属性的月份数据对象
 *   - name: string - 月份英文名称
 *   - days: number - 该月的总天数
 *   - firstDayOffset: number - 该月第一天的星期偏移
 *   - completedDays?: number[] - 有完成记录的天数数组
 *
 * 触发的事件：
 * - enterMonth: 点击卡片时触发，传递 month 对象，通知父组件导航至该月的详细视图
 *
 * 样式特点：
 * - 使用 Tailwind CSS 响应式设计，适配 sm/lg 断点
 * - 卡片具有悬停动画效果（背景色变化、箭头淡入、月度名称微移）
 * - 日期圆点根据完成状态显示不同大小和颜色
 *
 * 依赖组件：
 * - ArrowUpRight: lucide-vue-next 图标库中的箭头图标，用于悬停提示
 */
import { ArrowUpRight } from 'lucide-vue-next'

/** 月份数据结构 */
interface MonthData {
  /** 月份英文名称 */
  name: string
  /** 该月的总天数 */
  days: number
  /** 该月第一天的星期偏移 */
  firstDayOffset: number
  /** 有完成记录的天数数组（可选） */
  completedDays?: number[]
  /** 该月数据是否正在加载（可选） */
  isLoading?: boolean
  /** 该月数据是否已加载完成（可选） */
  isLoaded?: boolean
}

defineProps<{
  month: MonthData
}>()

defineEmits(['enterMonth'])
</script>

<style scoped>
</style>
