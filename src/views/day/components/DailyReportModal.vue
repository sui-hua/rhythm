<template>
  <!--
    DailyReportModal — 每日日报弹窗
    主要结构：标题区、四格统计卡片、昨日改进提醒、操作按钮
  -->
  <Dialog :open="show" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md p-6 rounded-xl border shadow-lg bg-background">
      <!-- 标题区开始 -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <DialogTitle class="text-xl font-semibold">每日日报</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground mt-1">昨天复盘 · 今天计划</DialogDescription>
        </div>
      </div>
      <!-- 标题区结束 -->

      <!-- 统计卡片网格开始：2x2 布局展示昨日与今日的任务概况 -->
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

      <!-- 昨日改进提醒开始：将昨日总结中的改进事项带回今日执行场景 -->
      <div v-if="stats.yesterdayImprove" class="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        <p class="text-xs font-medium text-muted-foreground">昨日改进提醒</p>
        <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {{ stats.yesterdayImprove }}
        </p>
      </div>
      <!-- 昨日改进提醒结束 -->

      <!-- 操作按钮区开始：仅确认或顺延未完成任务 -->
      <div class="mt-6 flex flex-col gap-2">
        <Button variant="outline" class="w-full h-10" @click="$emit('confirm')">仅确认</Button>
        <Button class="w-full h-10" @click="$emit('confirm-carryover')">将未完成任务顺延至今天</Button>
      </div>
      <!-- 操作按钮区结束 -->
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
/**
 * DailyReportModal — 每日日报弹窗
 * 数据流：props（show/stats）→ template 渲染统计卡片 → emit（confirm/confirm-carryover/close）
 * 使用标准 Dialog 组件，展示昨日完成/未完成、今日任务数和顺延任务数
 */

// ── 依赖导入 ──
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ── Props ──
// show: 控制弹窗显隐 | stats: 四项统计数据和昨日改进提醒，默认值为空日报
const props = defineProps({
  show: Boolean,
  stats: {
    type: Object,
    default: () => ({
      yesterdayCompleted: 0,
      yesterdayUncompleted: 0,
      todayTotal: 0,
      carryoverToToday: 0,
      yesterdayImprove: ''
    })
  }
})

// ── Emits ──
// close: 关闭弹窗 | confirm: 用户已阅读日报 | confirm-carryover: 确认将未完成任务顺延到今天 | update:open: v-model 双向绑定
const emit = defineEmits(['close', 'confirm', 'confirm-carryover', 'update:open'])

// ── 方法 ──
// 同步 Dialog open 状态变化，关闭时额外触发 close 事件以兼容父组件现有监听
const handleOpenChange = (open: boolean) => {
  emit('update:open', open)
  if (!open) {
    emit('close')
  }
}
</script>
