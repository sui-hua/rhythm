<template>
  <!--
    TaskItem — 时间轴上的单个任务卡片，根据时长自适应三种布局
    主要结构：极短信布局（< 0.4h）、中等任务布局（0.4~0.8h）、长任务详细布局（>= 0.8h）
  -->
  <div
    :id="'task-' + index"
    class="transition-all duration-700 cursor-pointer select-none group"
    :class="embedded ? 'w-full h-full' : 'absolute'"
    :style="computedStyle"
    @click="$emit('select', index)"
    @dblclick="$emit('edit', index)"
  >
    <!-- 卡片实体：圆角根据时长动态变化，防止短任务变成奇怪的半圆 -->
    <div
      class="flex h-full relative overflow-hidden transition-all duration-500 border border-transparent shadow-none"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-row items-center py-0 px-2 rounded-lg' :
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2 px-4 rounded-xl min-h-[40px]' : 'flex-col py-4 px-5 gap-3 rounded-2xl',
        task.completed
          ? 'opacity-80 grayscale-[0.5] bg-zinc-50/80 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 border-dashed'
          : 'bg-white/50 backdrop-blur-xl dark:bg-zinc-900/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-100 dark:hover:border-white/10 ring-1 ring-black/5 dark:ring-white/10',
        isRunning ? 'ring-2 ring-primary bg-white! shadow-[0_8px_30px_rgb(0,0,0,0.08)]' : ''
      ]"
    >

      <!-- 中等任务布局（0.4 ~ 0.8h）：横向排列呼吸点 + 标题 -->
      <template v-if="(task.durationHours || 1) >= 0.4 && (task.durationHours || 1) < 0.8">
        <div class="flex items-center gap-2.5 w-full">
          <div
            class="w-1.5 h-1.5 rounded-full shrink-0 outline outline-2 outline-offset-1 transition-all duration-300"
            :class="task.completed ? 'bg-zinc-300 outline-zinc-100 dark:bg-zinc-700 dark:outline-zinc-800' : 'bg-primary outline-primary/20 group-hover:scale-110'"
          ></div>
          <h3
            class="flex-1 text-sm font-bold tracking-tight transition-transform duration-300 truncate"
            :class="!task.completed ? 'text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1' : 'line-through text-zinc-400'"
          >
            {{ task.title }}
          </h3>
        </div>
        <!-- 遗留任务标签：显示结转来源信息 -->
        <p
          v-if="task.isCarryOver"
          class="ml-4 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
        >
          {{ task.carryOverLabel }}
        </p>
      </template>

      <!-- 长任务详细布局开始（>= 0.8h）：分类标签 + 时间 + 标题 + 描述 + 操作按钮 -->
      <template v-else-if="(task.durationHours || 1) >= 0.8">
        <div class="flex items-center gap-3 shrink-0 opacity-80 pt-0.5">
          <Badge variant="secondary" class="text-[9px] font-black uppercase tracking-widest py-0 h-4 px-2 rounded bg-transparent border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
            {{ task.category }}
          </Badge>
          <span class="text-[11px] font-mono font-medium text-zinc-400 tracking-tight transition-colors group-hover:text-zinc-500">{{ task.time }} — {{ task.duration }}</span>
        </div>

        <p
          v-if="task.isCarryOver"
          class="ml-4 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
        >
          {{ task.carryOverLabel }}
        </p>
        
        <div class="flex items-center gap-2.5 mt-0.5 w-full shrink-0">
          <div 
            class="w-2 h-2 rounded-full shrink-0 outline outline-2 outline-offset-[3px] transition-all duration-300 mt-px"
            :class="task.completed ? 'bg-zinc-300 outline-zinc-100 dark:bg-zinc-700 dark:outline-zinc-800' : 'bg-primary outline-primary/20 group-hover:scale-110'"
          ></div>
          <h3 
            class="text-lg md:text-xl font-black tracking-tighter truncate leading-tight transition-transform duration-300"
            :class="!task.completed ? 'text-zinc-900 dark:text-zinc-50 group-hover:translate-x-1' : 'line-through text-zinc-400'"
          >
            {{ task.title }}
          </h3>
        </div>

        <p v-if="task.description && (task.durationHours || 1) >= 1.2" class="text-xs font-medium leading-relaxed max-w-2xl line-clamp-2 mt-0.5 ml-4 text-zinc-500/80 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
          {{ task.description }}
        </p>

        <!-- 长任务进度/计时操作：仅未完成的 task 类型显示执行/计时按钮 -->
        <div v-if="task.type === 'task' && !task.completed" class="mt-auto flex items-center justify-between gap-4 ml-4">
            <div v-if="isRunning" class="flex items-center gap-2">
                <Timer class="w-3.5 h-3.5 text-primary animate-pulse" />
                <span class="text-xs font-mono font-black" :class="isOvertime ? 'text-destructive' : 'text-primary'">
                    {{ displayTime }}
                    <span v-if="isOvertime" class="ml-1 text-[10px] tracking-widest animate-bounce">(超时)</span>
                </span>
            </div>
            <div class="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    v-if="!isRunning" 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-3 text-xs gap-1.5 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 rounded-lg font-bold"
                    @click.stop="dayStore.handleStartTask(task)"
                >
                    <Play class="w-3 h-3 fill-current" /> 执行
                </Button>
                <Button 
                    v-else 
                    size="sm" 
                    variant="ghost" 
                    class="h-7 px-3 text-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-bold"
                    @click.stop="store.openModal()"
                >
                    <Maximize2 class="w-3 h-3" /> 计时器
                </Button>
            </div>
        </div>
      </template>

      <!-- 极短信布局开始（< 0.4h）：仅显示呼吸点 + 标题，节省空间 -->
      <template v-else>
        <div class="flex items-center gap-2 w-full pt-px">
          <div 
            class="w-1.5 h-1.5 rounded-full shrink-0 outline outline-2 outline-offset-1 transition-all duration-300"
            :class="task.completed ? 'bg-zinc-300 outline-zinc-100 dark:bg-zinc-700 dark:outline-zinc-800' : 'bg-primary outline-primary/20 group-hover:scale-110'"
          ></div>
          <h3 
            class="text-[11px] font-bold tracking-tight transition-transform duration-300 truncate leading-none"
            :class="!task.completed ? 'text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1' : 'line-through text-zinc-400'"
          >
            {{ task.title }}
          </h3>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
/**
 * TaskItem — 时间轴上的单个任务卡片组件
 * 数据流：task prop → computedStyle（定位计算）→ 模板渲染
 * 根据任务时长自动切换三种布局：极短信（< 0.4h）、中等（0.4~0.8h）、长任务（>= 0.8h）
 */

// ── 依赖导入 ──
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Timer, Maximize2 } from 'lucide-vue-next'
import { useDayStore } from '@/stores/dayStore'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { buildTaskHorizontalLayoutStyle } from '@/views/day/utils/taskLayoutStyle'
import type { DailyScheduleItem } from '@/types/models'

// ── Props ──
// task: 任务数据对象 | index: 任务在列表中的索引 | embedded: 是否嵌入模式（非时间轴定位）
const props = defineProps({
  task: {
    type: Object as () => DailyScheduleItem,
    required: true
  },
  index: Number,
  embedded: { type: Boolean, default: false }
})

// ── Emits ──
// select: 单击选中任务 | edit: 双击编辑任务
const emit = defineEmits(['select', 'edit'])

// ── Store ──
const dayStore = useDayStore()
const store = usePomodoroStore()

// ── 计算属性 ──
// 计算任务卡片在时间轴上的定位样式（top/height 由 --hour-height 驱动，水平位置由列分配决定）
// embedded 模式下返回空对象，由父容器控制布局
const computedStyle = computed(() => {
  if (props.embedded) return {}

  return {
    top: `calc(${props.task.startHour || 0} * var(--hour-height))`,
    height: `calc(${props.task.durationHours || 1} * var(--hour-height))`,
    ...buildTaskHorizontalLayoutStyle(props.task)
  }
})

// 任务是否正在执行中（有开始时间且无结束时间且未完成）
const isRunning = computed(() => !!props.task.actual_start_time && !props.task.actual_end_time && !props.task.completed)

// 当前任务是否为番茄钟 Store 中的活跃任务，用于同步计时显示
const isStoreActive = computed(() => store.activeTask?.id === props.task.id)

// 显示的计时文本：活跃任务使用 Store 实时时间，否则显示初始值
const displayTime = computed(() => isStoreActive.value ? store.formattedTime : '00:00')

// 是否超时：已用时间超过计划时长时返回 true，用于显示超时警告
const isOvertime = computed(() => {
    if (!isRunning.value) return false
    // 优先取习惯原始时长（分钟），其次用 rawDuration（小时→分钟），最后默认 30 分钟
    const originalDuration = props.task.type === 'habit' ? props.task.original?.duration : undefined
    const scheduledMins = originalDuration || props.task.rawDuration * 60 || 30
    const elapsed = isStoreActive.value ? store.elapsedSeconds : 0
    return elapsed > scheduledMins * 60
})
</script>

<style scoped>
</style>
