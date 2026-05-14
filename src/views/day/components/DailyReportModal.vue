<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm daily-report-backdrop" @click="$emit('close')"></div>
    <div v-if="show" class="fixed inset-0 z-[301] flex items-center justify-center px-4">
      <div class="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6 daily-report-panel">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold">每日日报</h2>
            <p class="text-xs text-muted-foreground mt-1">昨天复盘 · 今天计划</p>
          </div>
          <button class="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-50" @click="$emit('close')" aria-label="关闭">
            ✕
          </button>
        </div>

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

        <div class="mt-6 flex flex-col gap-2">
          <button class="w-full h-10 rounded-lg bg-foreground text-background font-medium" @click="$emit('confirm-carryover')">确认转移到今天</button>
          <button class="w-full h-10 rounded-lg border border-border text-foreground font-medium hover:bg-zinc-50" @click="$emit('confirm')">知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup>
/**
 * DailyReportModal.vue - 每日日报弹窗组件
 *
 * 功能说明：
 * - 每日日报弹窗，用于展示前一天的复盘数据和当日任务概况
 * - 使用 Teleport 将弹窗渲染到 body 层级，避免层级嵌套问题
 * - 包含两项统计数据展示区和两个操作按钮
 *
 * 统计数据内容：
 * - 昨天已完成：昨日标记为已完成的任务数量
 * - 昨天未完成：昨日未完成且顺延到今天的任务数量
 * - 今日任务数：当日计划的任务总数
 * - 顺延到今天：从昨日顺延过来的未完成任务数
 *
 * 交互说明：
 * - 点击遮罩层或关闭按钮触发 close 事件关闭弹窗
 * - "确认转移到今天"按钮将未完成任务顺延到今日计划
 * - "知道了"按钮仅关闭弹窗，不执行任何数据操作
 *
 * 使用示例：
 * // 传入 show 和 stats 参数，通过事件处理关闭和确认操作
 */
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

/**
 * 组件事件定义
 * @event close - 点击遮罩或关闭按钮时触发，用于关闭弹窗
 * @event confirm - 点击"知道了"按钮时触发，仅关闭弹窗
 * @event confirm-carryover - 点击"确认转移到今天"按钮时触发，执行任务顺延逻辑
 */
defineEmits(['close', 'confirm', 'confirm-carryover'])
</script>

<style scoped>

.daily-report-backdrop {
  animation: daily-report-fade 200ms ease-out;
}

.daily-report-panel {
  animation: daily-report-pop 240ms ease-out;
}

@keyframes daily-report-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes daily-report-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
