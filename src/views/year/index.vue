<template>
  <!--
    Year 页面 — 年度总览视图入口
    主要结构：顶部导航栏（返回首页 + 年份）、12 个月份热力图网格
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- 顶部导航栏：返回首页 + 年份标题 -->
    <div class="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm">
      <!-- 左侧：返回首页按钮 -->
      <router-link
        to="/"
        class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft class="w-4 h-4" />
        <span class="text-xs font-semibold tracking-wide">HOME</span>
      </router-link>

      <!-- 中间：年份标题 -->
      <h1 class="text-sm font-black tracking-wider">
        {{ currentYear }}
      </h1>

      <!-- 右侧占位，保持布局对称 -->
      <div class="w-16"></div>
    </div>

    <!-- 年度网格，展示每月习惯打卡热力图，顶部留出导航栏空间 -->
    <div class="w-full h-full pt-12">
      <YearGrid
        :year-data="yearData"
        @enter-month="enterMonth"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Year 页面入口
 * 展示层 + 导航逻辑：返回首页
 * 数据流：useYearView → yearData / enterMonth → YearGrid 组件
 */

// ── 依赖导入 ──
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useYearView } from '@/views/year/composables/useYearView'
import YearGrid from '@/views/year/components/YearGrid.vue'
import { useDateStore } from '@/stores/dateStore'
import { getRouteYearContext } from '@/views/day/utils/routeDateContext'

// ── 视图状态 ──
// 从 composable 获取年度打卡数据和月份点击导航方法
const { yearData, enterMonth } = useYearView()

const route = useRoute()
const dateStore = useDateStore()

// 当前路由中的年份，用于顶部标题展示
const currentYear = computed((): number =>
  getRouteYearContext(route.params.year as string, dateStore.currentDate.getFullYear()).year
)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
