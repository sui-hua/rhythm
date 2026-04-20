<template>
  <header class="h-24 px-12 flex items-center justify-between border-b border-zinc-100 shrink-0">
    <div class="flex items-center gap-8">
      <Button
        variant="outline"
        size="icon"
        class="w-12 h-12 rounded-full border-zinc-100 transition-all hover:bg-foreground hover:text-background hover:border-foreground"
        @click="$emit('goBack')"
      >
        <ArrowLeft class="w-6 h-6" />
      </Button>
      <h2 class="text-4xl font-black tracking-tighter uppercase italic">{{ selectedMonth?.name }} {{ year }}</h2>
    </div>
  </header>
</template>

<script setup>
/**
 * MonthHeader.vue - 月度视图顶部导航栏组件
 * 
 * 功能说明：
 * - 展示当前所选月份的名称和年份
 * - 提供返回上一页（返回月列表）的导航按钮
 * 
 * Props：
 * - selectedMonth: Object - 当前选中的月份对象，包含 name（月份名称，如 "January"）等属性
 * - year: Number - 当前显示的年份
 * 
 * 事件：
 * - goBack: 点击返回按钮时触发，用于通知父组件切换回月列表视图
 * 
 * 使用场景：
 * - 位于 Month 月度视图页面顶部，作为月度详情的导航头
 * - 与 MonthCalendar 月历组件配合使用，共同构成月度视图
 * 
 * 样式说明：
 * - 固定高度 6rem (h-24)，使用 flex 布局水平居中
 * - 底部边框分隔，采用 zinc-100 浅灰色
 * - 返回按钮使用圆形图标样式，hover 时颜色反转
 */

import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  selectedMonth: Object,
  year: Number
})

defineEmits(['goBack'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
