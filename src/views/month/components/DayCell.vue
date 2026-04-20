<template>
  <div
    class="bg-card p-2 sm:p-4 flex flex-col transition-all relative overflow-hidden flex-1 min-h-0"
    :class="day.isCurrent ? 'cursor-pointer group z-10' : 'bg-transparent cursor-default opacity-10'"
    @click="day.isCurrent && $emit('enterDay', day.date)"
  >
    <!-- Hover Bottom Border -->
    <div v-if="day.isCurrent" class="absolute bottom-0 left-0 right-0 h-0 bg-foreground transition-all duration-300 ease-out z-20 group-hover:h-1"></div>
    
    <!-- Foreground Content -->
    <div class="relative z-10 flex h-full items-start pointer-events-none">
      <div class="flex flex-col gap-1">
        <!-- Geometric Event Indicators -->
        <div v-if="day.isCurrent && day.tasks?.length" class="flex gap-0.5 h-1">
          <div 
            v-for="i in Math.min(day.tasks.length, 5)" 
            :key="i"
            class="w-1 h-1 bg-foreground/20 transition-colors duration-300 group-hover:bg-foreground"
          ></div>
          <div v-if="day.tasks.length > 5" class="w-1 h-1 border-b border-r border-foreground/20 rotate-45 transform -translate-y-0.5 ml-0.5 group-hover:border-foreground"></div>
        </div>
        
        <div class="flex items-baseline gap-1">
          <span
            class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none transition-colors duration-500"
            :class="day.isCurrent ? 'text-foreground' : 'text-zinc-300'"
          >
            {{ day.date }}
          </span>
        </div>
      </div>
    </div>

    <!-- Vertical Metric Ruler (Bauhaus Style) -->
    <div v-if="day.isCurrent" class="absolute right-0 top-0 bottom-0 w-6 sm:w-8 flex flex-col justify-between py-4 sm:py-6 z-10">
      <div
        v-for="h in 24"
        :key="h"
        class="h-px bg-zinc-100 transition-all duration-300 self-end"
        :class="day.taskHours?.includes(h) 
          ? 'w-4 sm:w-6 bg-foreground group-hover:w-5 sm:group-hover:w-7 group-hover:bg-foreground' 
          : 'w-1 sm:w-2 opacity-30 group-hover:opacity-100 group-hover:bg-zinc-300'"
      ></div>
    </div>
  </div>
</template>

/**
 * DayCell.vue - 月度视图日期单元格组件
 * 
 * 功能说明：
 * - 在月度日历视图中渲染单个日期单元格
 * - 支持当前月份日期和非当前月份日期（灰色淡化）两种状态
 * - 显示日期数字、任务数量指示器、24小时时间刻度尺
 * 
 * 设计风格：
 * - 采用 Bauhaus 风格的几何图形设计
 * - 垂直24小时刻度尺位于单元格右侧，体现工业美学
 * - 悬停时平滑过渡效果，任务指示器和刻度尺高亮
 * 
 * 交互行为：
 * - 仅当前月份日期可点击，点击触发 enterDay 事件
 * - 悬停时底部出现高亮边框，元素颜色变深
 * - 最多显示5个任务指示点，超出显示菱形标记
 * 
 * Props：
 * - day: Object - 日期数据对象
 *   - day.date: Number - 日期数字（1-31）
 *   - day.isCurrent: Boolean - 是否为当前月份日期
 *   - day.tasks: Array - 当日任务列表（可选）
 *   - day.taskHours: Array - 有任务的小时数组（可选）
 * 
 * Events：
 * - enterDay: 点击当前月份日期时触发，参数为日期字符串
 */
<script setup>
defineProps({
  day: Object
})

defineEmits(['enterDay'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
