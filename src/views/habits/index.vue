<!--
  ============================================
  Habits 视图 - 习惯追踪主页面 (views/habits/index.vue)
  ============================================

  【模块职责】
  - 习惯追踪模块主页面
  - 设备检测分发：桌面端 → HabitsDesktopPage，移动端 → HabitsMobilePage

  【布局结构】
  - HabitsDesktopPage: HabitSidebar + 主内容区 (PC 侧边栏+内容)
  - HabitsMobilePage: 主内容优先 + HabitMobileListSheet 底部抽屉
-->
<template>
  <HabitsDesktopPage v-if="!isMobile" />
  <HabitsMobilePage v-else />
</template>

<script setup>
import { useMobile } from '@/composables/useMobile'
import HabitsDesktopPage from '@/views/habits/HabitsDesktopPage.vue'
import HabitsMobilePage from '@/views/habits/HabitsMobilePage.vue'

const { isMobile } = useMobile()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
