<template>
  <!-- 每日日报弹窗：使用标准 Dialog 组件 -->
  <Dialog :open="show" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md p-6 rounded-xl border shadow-lg bg-background">
      <!-- 弹窗标题区 -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <DialogTitle class="text-xl font-semibold">每日日报</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground mt-1">昨天复盘 · 今天计划</DialogDescription>
        </div>
      </div>
      <!-- 弹窗标题区结束 -->

      <!-- 统计卡片网格 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">昨天已完成</p>
          <p class="text-2xl font-semibold mt-2">{{ stats.yesterdayCompleted }}</p>
        </div>
        <div class="rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">昨天未完成</p>
          <p class="text-2xl font-semibold mt-2">{{ stats.yesterdayUncompleted }}</p>
        </div>
        <div class="rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">今日任务数</p>
          <p class="text-2xl font-semibold mt-2">{{ stats.todayTotal }}</p>
        </div>
        <div class="rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">顺延到今天</p>
          <p class="text-2xl font-semibold mt-2">{{ stats.carryoverToToday }}</p>
        </div>
      </div>
      <!-- 统计卡片网格结束 -->

      <!-- 操作按钮区 -->
      <div class="mt-6 flex flex-col gap-2">
        <Button class="w-full h-10" @click="$emit('confirm-carryover')">确认转移到今天</Button>
        <Button variant="outline" class="w-full h-10" @click="$emit('confirm')">知道了</Button>
      </div>
      <!-- 操作按钮区结束 -->
    </DialogContent>
  </Dialog>
</template>

<script setup>
/**
 * DailyReportModal - 每日日报弹窗
 *
 * 使用标准 Dialog 组件替代原有的 Teleport + 自定义动画实现。
 * 展示昨日完成/未完成、今日任务数和顺延任务数的统计卡片。
 */
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// 弹窗显示状态和统计数据
const props = defineProps({
  show: Boolean,
  stats: {
    type: Object,
    default: () => ({
      yesterdayCompleted: 0,
      yesterdayUncompleted: 0,
      todayTotal: 0,
      carryoverToToday: 0
    })
  }
})

// 事件：close（关闭）、confirm（确认）、confirm-carryover（确认顺延）、update:open（v-model 支持）
const emit = defineEmits(['close', 'confirm', 'confirm-carryover', 'update:open'])

// Dialog open 状态变化时，同步触发 close 事件以兼容父组件现有监听
const handleOpenChange = (open) => {
  emit('update:open', open)
  if (!open) {
    emit('close')
  }
}
</script>
