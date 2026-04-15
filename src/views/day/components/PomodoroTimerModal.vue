<template>
  <Dialog :open="store.showModal" @update:open="store.showModal = $event">
    <DialogContent
      class="sm:max-w-[440px] p-0 overflow-hidden border bg-background text-foreground shadow-xl rounded-[2.5rem] [&>button]:hidden"
    >
      <div class="relative p-10 flex flex-col items-center gap-10 min-h-[460px] justify-center overflow-hidden">
        <!-- Animated Background Glows -->
        <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
        <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none"></div>

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

        <!-- Large Timer Display with Progress Ring -->
        <div class="z-10 flex items-center justify-center relative w-64 h-64">
            <!-- Progress Circle SVG -->
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
                    :stroke-dasharray="290"
                    :stroke-dashoffset="progressOffset"
                />
            </svg>

            <!-- Glow Effect -->
            <div class="absolute inset-4 rounded-full bg-primary/5 blur-xl"></div>

            <div class="relative flex flex-col items-center">
                <div class="text-6xl font-mono font-black tracking-tighter tabular-nums drop-shadow-sm transition-all" 
                     :class="isOvertime ? 'text-destructive scale-110' : 'text-foreground'">
                     {{ store.formattedTime }}
                </div>
                <div v-if="isOvertime" class="absolute -bottom-6 text-[9px] font-black text-destructive mt-2 flex items-center gap-1 uppercase tracking-widest animate-pulse whitespace-nowrap">
                   OVERTIME • {{ store.activeTask?.original?.duration || 30 }}m limit
                </div>
            </div>
        </div>

        <div class="z-10 w-full flex flex-col gap-4 px-4 pb-4">
            <Button 
                class="w-full h-16 rounded-[1.25rem] bg-primary text-primary-foreground text-lg font-black shadow-[0_8px_20px_-8px_rgba(var(--color-primary-rgb),0.5)] hover:shadow-[0_12px_25px_-8px_rgba(var(--color-primary-rgb),0.6)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-300"
                @click="handleComplete"
            >
                <CheckCircle class="w-6 h-6 mr-3" />
                完成并记录
            </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-vue-next'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useDayData } from '@/views/day/composables/useDayData'

/**
 * 番茄钟计时模态框 (PomodoroTimerModal.vue)
 * 当任务开始计时时弹出，显示巨型计时器并提供完成操作。
 */

const store = usePomodoroStore()
const { handleToggleComplete } = useDayData()

// 计算圆环进度
const progressPercent = computed(() => {
    if (!store.activeTask) return 0
    const scheduledMins = store.activeTask.original?.duration || 30
    const totalSecs = scheduledMins * 60
    return Math.min(100, (store.elapsedSeconds / totalSecs) * 100)
})

const progressOffset = computed(() => {
    const circumference = 2 * Math.PI * 46 // 290
    return circumference - (progressPercent.value / 100) * circumference
})

// 判断是否超过了计划时长
const isOvertime = computed(() => {
    if (!store.activeTask) return false
    const scheduledMins = store.activeTask.original?.duration || 30
    return store.elapsedSeconds > scheduledMins * 60
})

/**
 * 处理完成并保存真实耗时
 */
const handleComplete = async () => {
    if (store.activeTask) {
        await handleToggleComplete(store.activeTask)
        store.reset()
    }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

/* 增加一些毛玻璃或光影效果的样式微调 */
</style>
