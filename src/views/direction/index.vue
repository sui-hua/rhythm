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
/**
 * ================================================================================
 * Direction 视图 - 长期目标管理模块入口
 * ================================================================================
 *
 * 【文件职责】
 * - 作为 Direction 模块的主页面入口，负责设备检测和视图分发
 * - 不直接渲染业务内容，仅根据设备类型选择对应的子页面组件
 *
 * 【设备适配】
 * - 桌面端 (isMobile=false)：渲染 DirectionDesktopPage，提供完整的三栏布局
 *   - 左侧边栏 (DirectionSidebar)：目标分类导航
 *   - 中间任务面板 (MissionBoard)：月度计划与每日任务管理
 *   - 右侧归档区 (MissionArchive)：已完成任务归档
 *
 * - 移动端 (isMobile=true)：渲染 DirectionMobilePage，提供紧凑的单栏布局
 *   - 主内容区：任务面板
 *   - 底部抽屉 (DirectionMobileGoalSheet)：目标选择器
 *
 * 【数据层级】
 * - plans (年度目标)
 *   └── monthly_plans (月度计划)
 *       └── daily_plans (每日任务)
 *
 * 【状态管理】
 * - 使用 useMobile composable 获取设备状态 isMobile
 * - isMobile 为响应式引用，设备切换时自动更新
 *
 * 【相关文件】
 * - DirectionDesktopPage.vue : 桌面端完整页面
 * - DirectionMobilePage.vue  : 移动端适配页面
 * - @/composables/useMobile   : 设备检测逻辑
 */
import { useMobile } from '@/composables/useMobile'
import DirectionDesktopPage from '@/views/direction/DirectionDesktopPage.vue'
import DirectionMobilePage from '@/views/direction/DirectionMobilePage.vue'

const { isMobile } = useMobile()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
