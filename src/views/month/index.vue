<template>
  <!--
    Month 页面 — 月度日历视图入口
    主要结构：顶部导航栏（返回 + 月份切换）、全屏月历网格
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- 顶部导航栏：返回年度视图 + 月份名称 + 上/下月切换 -->
    <div class="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm">
      <!-- 左侧：返回年度视图按钮 -->
      <button
        class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
        @click="goBackToYear"
      >
        <ArrowLeft class="w-4 h-4" />
        <span class="text-xs font-semibold tracking-wide">{{ routeYear }}</span>
      </button>

      <!-- 中间：月份名称 -->
      <h1 class="text-sm font-black tracking-wider uppercase">
        {{ selectedMonth.name }}
      </h1>

      <!-- 右侧：上一月 / 下一月切换 -->
      <div class="flex items-center gap-2">
        <button
          class="p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
          @click="goToPrevMonth"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
          @click="goToNextMonth"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 月历网格区域，顶部留出导航栏空间 -->
    <div class="fixed inset-0 z-[90] h-full w-full bg-background flex flex-col pt-12">
      <MonthGrid
        :month-grid-data="monthGridData"
        @enter-day="enterDay"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Month 页面入口
 * 展示层 + 导航逻辑：返回年度视图、上/下月切换
 * 数据流：useMonthView → monthGridData / enterDay / 导航方法 → MonthGrid 组件
 */

// ── 依赖导入 ──
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useMonthView } from '@/views/month/composables/useMonthView'
import MonthGrid from '@/views/month/components/MonthGrid.vue'
import { buildMonthPath } from '@/views/day/utils/routeDateContext'

// ── 视图状态 ──
// 从 composable 获取月历网格数据、路由年月和导航方法
const { selectedMonth, monthGridData, routeYear, routeMonth, enterDay, goBackToYear } = useMonthView()

const router = useRouter()

/**
 * 导航到上一月
 * 如果当前是 1 月，则跳转到上一年的 12 月
 */
const goToPrevMonth = (): void => {
  const month = routeMonth.value
  const year = routeYear.value
  if (month <= 1) {
    router.push(buildMonthPath(year - 1, 12))
  } else {
    router.push(buildMonthPath(year, month - 1))
  }
}

/**
 * 导航到下一月
 * 如果当前是 12 月，则跳转到下一年的 1 月
 */
const goToNextMonth = (): void => {
  const month = routeMonth.value
  const year = routeYear.value
  if (month >= 12) {
    router.push(buildMonthPath(year + 1, 1))
  } else {
    router.push(buildMonthPath(year, month + 1))
  }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
