<!--
  ============================================
  Direction 视图 - 目标管理主页面 (views/direction/index.vue)
  ============================================

  【模块职责】
  - 长期目标管理模块主页面
  - 设备检测分发：桌面端 → DirectionDesktopPage，移动端 → DirectionMobilePage

  【布局结构】
  - DirectionDesktopPage: DirectionSidebar + MissionBoard + MissionArchive (PC 三栏)
  - DirectionMobilePage: MissionBoard 主内容 + DirectionMobileGoalSheet 底部抽屉
-->
<template>
  <DirectionDesktopPage v-if="!isMobile" />
  <DirectionMobilePage v-else />
</template>

<script setup>
import { useMobile } from '@/composables/useMobile'
import DirectionDesktopPage from '@/views/direction/DirectionDesktopPage.vue'
import DirectionMobilePage from '@/views/direction/DirectionMobilePage.vue'

const { isMobile } = useMobile()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
