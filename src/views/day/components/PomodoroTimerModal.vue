<template>
  <!--
    PomodoroTimerModal — 番茄钟专注计时弹窗
    主要结构：背景光晕、任务标题与状态标签、环形进度计时器、完成按钮
  -->
  <Dialog :open="store.showModal" @update:open="store.showModal = $event">
    <DialogContent
      class="sm:max-w-[440px] p-0 overflow-hidden border bg-background text-foreground shadow-xl rounded-[2.5rem] [&>button]:hidden"
    >
      <div class="relative p-10 flex flex-col items-center gap-10 min-h-[460px] justify-center overflow-hidden">
        <!-- 背景光晕开始：两个渐变圆形营造氛围感 -->
        <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
        <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none"></div>
        <!-- 背景光晕结束 -->

        <!-- 任务标题区开始：含专注模式状态指示器 -->
        <div class="z-10 flex flex-col items-center gap-3 text-center w-full">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">专注模式中</span>
            </div>
            <h2 class="text-3xl font-black tracking-tight mt-2 max-w-[340px] line-clamp-2 px-4 text-foreground">
                {{ store.activeTask?.title }}
            </h2>
        </div>
        <!-- 任务标题区结束 -->

        <!-- 计时器区开始：SVG 环形进度条 + 中央时间显示 -->
        <div class="z-10 flex items-center justify-center relative w-64 h-64">
            <!-- 环形进度条 SVG：底层灰色轨道 + 上层主色进度弧 -->
            <svg class="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="text-muted"
                />
                <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                    class="text-primary transition-all duration-1000 ease-linear"
                    :stroke-dasharray="2 * Math.PI * 46"
                    :stroke-dashoffset="progressOffset"
                />
            </svg>

            <!-- 中央光晕效果 -->
            <div class="absolute inset-4 rounded-full bg-primary/5 blur-xl"></div>

            <!-- 时间数字：超时后变红放大 -->
            <div class="relative flex flex-col items-center">
                <div class="text-6xl font-mono font-black tracking-tighter tabular-nums drop-shadow-sm transition-all"
                     :class="isOvertime ? 'text-destructive scale-110' : 'text-foreground'">
                     {{ store.formattedTime }}
                </div>
                <!-- 超时提示：仅在超出预定时长后显示 -->
                <div v-if="isOvertime" class="absolute -bottom-6 text-[9px] font-black text-destructive mt-2 flex items-center gap-1 uppercase tracking-widest animate-pulse whitespace-nowrap">
                   OVERTIME • {{ scheduledMinutes }}m limit
                </div>
            </div>
        </div>
        <!-- 计时器区结束 -->

        <!-- 操作按钮区开始 -->
        <div class="z-10 w-full flex flex-col gap-4 px-4 pb-4">
            <Button
                class="w-full h-16 rounded-[1.25rem] bg-primary text-primary-foreground text-lg font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-300"
                @click="handleComplete"
            >
                <CheckCircle class="w-6 h-6 mr-3" />
                完成并记录
            </Button>
        </div>
        <!-- 操作按钮区结束 -->
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
/**
 * PomodoroTimerModal — 番茄钟专注计时弹窗
 * 数据流：pomodoroStore（计时状态/当前任务）→ 计算属性（进度/超时）→ 完成时写回 dayStore
 */

// ── 依赖导入 ──
import { computed } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-vue-next'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useDayStore } from '@/stores/dayStore'

// ── Store ──
const store = usePomodoroStore()
const dayStore = useDayStore()

// ── 计算属性 ──
// 从任务的 start_time/end_time 计算预定时长（分钟），默认 30 分钟
const scheduledMinutes = computed(() => {
    const task = store.activeTask?.original
    if (!task?.start_time || !task?.end_time) return 30
    const start = new Date(task.start_time)
    const end = new Date(task.end_time)
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
})

// 已用时间占预定时长的百分比，上限 100
const progressPercent = computed(() => {
    if (!store.activeTask) return 0
    const totalSecs = scheduledMinutes.value * 60
    return Math.min(100, (store.elapsedSeconds / totalSecs) * 100)
})

// SVG 圆环周长偏移量：周长 = 2 * PI * 46，偏移越小弧线越长
const progressOffset = computed(() => {
    const circumference = 2 * Math.PI * 46
    return circumference - (progressPercent.value / 100) * circumference
})

// 是否已超时：用于触发 UI 变红和超时提示
const isOvertime = computed(() => {
    if (!store.activeTask) return false
    return store.elapsedSeconds > scheduledMinutes.value * 60
})

// ── 方法 ──
// 完成专注：将任务标记为已完成并重置番茄钟状态
const handleComplete = async () => {
    if (store.activeTask) {
        const active = store.activeTask
        // 构造 DailyScheduleItem 用于 toggleComplete 分发
        await dayStore.handleToggleComplete({
            id: active.id,
            type: 'task',
            sourceLabel: 'task',
            original: active.original!,
            title: active.title,
            completed: active.completed,
            durationHours: scheduledMinutes.value / 60,
            rawDuration: scheduledMinutes.value / 60,
            time: '',
            duration: '',
            category: '个人任务',
            description: '',
            actual_start_time: active.actual_start_time,
            actual_end_time: active.actual_end_time
        })
        store.reset()
    }
}
</script>

<style scoped>
</style>
