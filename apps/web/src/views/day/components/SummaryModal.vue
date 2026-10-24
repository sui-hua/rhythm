<template>
  <!--
    SummaryModal — 日总结弹窗，复用 Summary 模块的 DailySummaryForm
    主要结构：Dialog 容器、语义标题、DailySummaryForm 表单
  -->
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[500px] p-6 rounded-xl border shadow-lg bg-background">
      <!-- 语义标题开始：仅供屏幕阅读器访问 -->
      <DialogTitle class="sr-only">完成今日总结</DialogTitle>
      <DialogDescription class="sr-only">回顾今日完成情况，规划明日任务</DialogDescription>
      <!-- 语义标题结束 -->

      <!-- 弹窗主体开始 -->
      <div class="flex flex-col gap-6">
        <!-- 标题区块开始 -->
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">完成今日总结</h1>
          <p class="text-sm text-muted-foreground">回顾今日完成情况，规划明日任务</p>
        </div>
        <!-- 标题区块结束 -->

        <!-- 总结表单：复用 Summary 模块的 DailySummaryForm -->
        <DailySummaryForm
          :initial-data="prefilledData"
          @save="handleSave"
          @cancel="$emit('update:show', false)"
        />
      </div>
      <!-- 弹窗主体结束 -->
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
/**
 * SummaryModal — 日总结弹窗组件
 * 数据流：dayStore.dailySchedule → buildDailySummaryPrefill → prefilledData → DailySummaryForm
 * 职责：在时序页面弹出总结表单，复用 Summary 模块的 DailySummaryForm 组件
 */

// ── 依赖导入 ──
import { computed } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import DailySummaryForm from '@/views/summary/components/DailySummaryForm.vue'
import { buildDailySummaryPrefill } from '@/views/summary/composables/useSummaryPrefill'
import { useDayStore } from '@/stores/dayStore'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { buildDefaultPeriod } from '@/services/db/summaryPeriods'
import { buildSummaryPayload } from '@/services/db/summaryAdapters'
import type { SummaryRecord } from '@/services/db/summaryAdapters'
import { safeAction } from '@/utils/safeAction'

// ── Props ──
// show: 控制弹窗显隐
defineProps<{
  show: boolean
}>()

// ── Emits ──
// update:show: v-model 双向绑定 | saved: 保存成功后通知父组件
const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: []
}>()

// ── Store ──
const dayStore = useDayStore()
const authStore = useAuthStore()

// ── 计算属性 ──
// 从 dayStore.dailySchedule 构建预填数据
const prefilledData = computed(() => {
  const schedule = dayStore.dailySchedule

  // 分离任务、习惯和目标计划
  const tasks = schedule
    .filter(item => item.type === 'task')
    .map(item => ({
      title: item.title,
      completed: item.completed
    }))

  const habits = schedule
    .filter(item => item.type === 'habit')
    .map(item => ({
      title: item.title,
      completed: item.completed
    }))

  const directionItems = schedule
    .filter(item => item.type === 'goal_day')
    .map(item => ({
      title: item.title,
      sourceMeta: {
        planTitle: item.category
      }
    }))

  const prefill = buildDailySummaryPrefill({ tasks, habits, directionItems })

  // 只有有内容时才返回预填数据
  if (prefill.done || prefill.improve || prefill.tomorrow) {
    return { content: prefill } satisfies Pick<SummaryRecord, 'content'>
  }

  return undefined
})

// ── 方法 ──
// 保存总结数据到数据库
async function handleSave(data: Record<string, string>) {
  await safeAction(async () => {
    const userId = authStore.userId
    if (!userId) {
      throw new Error('当前用户未登录，无法保存总结')
    }

    const kind = 'daily'
    const period = buildDefaultPeriod(kind, new Date())

    const payload = buildSummaryPayload({
      kind,
      userId,
      period,
      formData: data,
      existingRecord: null
    })

    await db.summary.create(payload)
    emit('saved')
    emit('update:show', false)
  }, '保存总结失败')
}
</script>

<style scoped>
</style>
