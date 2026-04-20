<template>
  <div
    :id="'task-' + index"
    class="absolute transition-all duration-700 cursor-pointer select-none group"
    :style="computedStyle"
    @click="$emit('select', index)"
    @dblclick="$emit('edit', index)"
  >
    <!-- 卡片实体：圆角根据时长动态变化，防止短任务变成奇怪的半圆 -->
    <div 
      class="flex h-full relative overflow-hidden transition-all duration-500 border border-transparent shadow-none"
      :class="[
        (task.durationHours || 1) < 0.4 ? 'flex-row items-center py-1 px-3 min-h-[24px] rounded-lg' : 
        (task.durationHours || 1) < 0.8 ? 'flex-row items-center py-2 px-4 rounded-xl min-h-[40px]' : 'flex-col py-4 px-5 gap-3 rounded-2xl',
        task.completed 
          ? 'opacity-80 grayscale-[0.5] bg-zinc-50/80 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 border-dashed' 
          : 'bg-white/50 backdrop-blur-xl dark:bg-zinc-900/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-100 dark:hover:border-white/10 ring-1 ring-black/5 dark:ring-white/10',
        isRunning ? 'ring-2 ring-primary bg-white! shadow-[0_8px_30px_rgb(0,0,0,0.08)]' : ''
      ]"
    >
      <!-- 取消了全部的左侧边缘竖线，全局统一采用呼吸点设计 -->

      <!-- 中等任务布局 (0.4 ~ 0.8h) -->
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
      </template>

      <!-- 长任务详细布局 (>= 0.8h) -->
      <template v-else-if="(task.durationHours || 1) >= 0.8">
        <div class="flex items-center gap-3 shrink-0 opacity-80 pt-0.5">
          <Badge variant="secondary" class="text-[9px] font-black uppercase tracking-widest py-0 h-4 px-2 rounded bg-transparent border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
            {{ task.category }}
          </Badge>
          <span class="text-[11px] font-mono font-medium text-zinc-400 tracking-tight transition-colors group-hover:text-zinc-500">{{ task.time }} — {{ task.duration }}</span>
        </div>
        
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

        <!-- 长任务进度/计时操作 -->
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
                    @click.stop="handleStartTask(task)"
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

      <!-- 极短信迷你布局 (< 0.4h) -->
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

/**
 * TaskItem.vue - 日程任务卡片组件
 * 
 * 功能说明：
 * - 在日视图时间轴上渲染单个任务条目
 * - 根据任务时长（durationHours）动态选择三种布局：
 *   1. 极短布局 (< 0.4h)：迷你横向卡片，仅显示标题和呼吸点
 *   2. 中等布局 (0.4 ~ 0.8h)：紧凑横向卡片，显示标题和状态点
 *   3. 详细布局 (>= 0.8h)：竖向卡片，显示分类标签、时间、描述和操作按钮
 * - 支持点击选中、双击编辑、运行中计时显示
 * - 根据完成状态和运行状态应用不同的视觉样式
 * 
 * 通信接口：
 * - Props: task (任务对象), index (在列表中的索引)
 * - Emits: select (点击选中), edit (双击编辑)
 * - 依赖 store: pomodoroStore (获取计时状态)
 * - 依赖 composable: useDayData (handleStartTask)
 * 
 * @see {@link https://github.com/your-repo/rhythm} 项目地址
 */

<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, CheckCircle, Timer, Maximize2 } from 'lucide-vue-next'
import { useDayData } from '@/views/day/composables/useDayData'
import { usePomodoroStore } from '@/stores/pomodoroStore'

// ============ Props & Emits ============
// props.task: 任务对象，包含 title、durationHours、startHour、completed 等字段
// props.index: 任务在当日任务列表中的索引，用于唯一标识和 emit 事件传参
const props = defineProps({
  task: Object,
  index: Number
})

// emit('select', index): 单击卡片时触发，用于选中该任务
// emit('edit', index): 双击卡片时触发，用于打开编辑弹窗
const emit = defineEmits(['select', 'edit'])

// ============ 计算样式 ============
// computedStyle: 计算任务卡片在时间轴上的定位样式
// - top: 根据任务开始时间(startHour)计算距顶部的偏移
// - height: 根据任务时长(durationHours)计算卡片高度
// - left/width: 当多列并行任务时，计算每列的宽度和左侧偏移
// - zIndex: 确保同一时间段的多个任务正确层叠显示
const computedStyle = computed(() => {
  // _col: 任务所在的列索引（用于多任务并行显示）
  // _numCols: 当前时间段的总列数
  const col = props.task._col || 0
  const numCols = props.task._numCols || 1
  
  const style = {
    // 使用 CSS 变量 --hour-height 计算实际像素位置
    top: `calc(${props.task.startHour} * var(--hour-height))`,
    // 使用 CSS 变量 --hour-height 计算实际像素高度
    height: `calc(${props.task.durationHours || 1} * var(--hour-height))`,
    minHeight: '28px',
    zIndex: col + 10
  }
  
  // 多列布局：并行任务需要分割宽度
  if (numCols > 1) {
    // 宽度 = (总宽度 - 时间轴左侧宽度) / 列数 - 间距
    style.width = `calc((100% - var(--timeline-left)) / ${numCols} - 6px)`
    // 左侧 = 时间轴宽度 + (每列宽度 * 列索引)
    style.left = `calc(var(--timeline-left) + ((100% - var(--timeline-left)) / ${numCols}) * ${col})`
  } else {
    // 单列布局：左对齐到时间轴
    style.left = `var(--timeline-left)`
    style.right = `0`
  }
  
  return style
})

// ============ Store & Composables ============
const { handleStartTask, handleToggleComplete } = useDayData()
const store = usePomodoroStore()

// ============ 运行状态计算属性 ============
// isRunning: 判断任务是否处于运行中状态
// 条件：有实际开始时间 && 没有结束时间 && 未完成
const isRunning = computed(() => !!props.task.actual_start_time && !props.task.actual_end_time && !props.task.completed)

// isStoreActive: 判断当前任务是否为 pomodoroStore 中正在计时的任务
const isStoreActive = computed(() => store.activeTask?.id === props.task.id)

// displayTime: 显示计时时间
// 如果任务正在 store 中计时，显示 store 的格式化时间，否则显示 00:00
const displayTime = computed(() => isStoreActive.value ? store.formattedTime : '00:00')

// isOvertime: 判断任务是否超时
// 比较已过时间(elapsedSeconds)与计划时长(scheduledMins)
const isOvertime = computed(() => {
    if (!isRunning.value) return false
    // original.duration 或 duration 或默认 30 分钟
    const scheduledMins = props.task.original?.duration || props.task.duration || 30
    const elapsed = isStoreActive.value ? store.elapsedSeconds : 0
    return elapsed > scheduledMins * 60
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
