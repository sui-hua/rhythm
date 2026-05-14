<template>
  <div 
    class="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent z-50 flex items-center pointer-events-none transition-all duration-500 animate-pulse"
    :style="{ top: `calc(${currentHour} * var(--hour-height))` }"
  >
    <div class="relative flex items-center">
      <div class="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full -ml-2 shadow-2xl shadow-red-500/60 ring-4 ring-red-500/20 animate-ping absolute"></div>
      <div class="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full -ml-2 shadow-2xl shadow-red-500/60 ring-2 ring-background relative z-10"></div>
    </div>
    <Badge variant="outline" class="ml-8 text-[9px] font-black text-red-600 uppercase tracking-[0.3em] border-red-200 bg-red-50/80 backdrop-blur-sm px-2 py-0.5 shadow-sm hover:bg-red-50">
      现在
    </Badge>
  </div>
</template>
<script setup>
/**
 * TimelineMarker.vue - 当前时间线标记组件
 *
 * 功能说明：
 * 在日视图时间轴上显示当前时间的位置，通过垂直红色横线和"现在"标签标识此时此刻。
 * 标记点会根据 currentHour prop 自动计算垂直位置（每小时对应 25vh）。
 *
 * 视觉效果：
 * - 红色渐变横线从左向右逐渐透明
 * - 圆形标记点带有脉冲动画效果（animate-ping + animate-pulse）
 * - "现在"标签使用 Badge 组件，带有红色主题样式
 * - 整体带有阴影和光晕效果，提升视觉层次感
 *
 * 使用方式：
 * 使用时传入 currentHour 参数，参数为当前小时数（0-23），用于计算标记的垂直位置
 *
 * @prop {number} currentHour - 当前小时数（0-23），用于计算标记的垂直位置
 */
import { Badge } from '@/components/ui/badge'

defineProps({
  // 当前小时数（0-23），决定标记在时间轴上的垂直位置
  // 计算公式：top = currentHour * 25 vh（每小时占据 25vh 高度）
  currentHour: Number
})
</script>

<style scoped>
</style>
