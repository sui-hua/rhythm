<template>
  <!-- =====================================================================
    Timeline.vue - 每日时间轴主体组件
    =====================================================================
    职责：
      - 渲染 24 小时纵向时间轴网格（背景刻度线 + 小时标签）
      - 将当天所有日程（TaskItem）按"重叠感知布局算法"排列
      - 展示当前时刻指示线（TimelineMarker）
      - 在数据加载时叠加毛玻璃遮罩，防止闪烁

    Props：
      - currentHour  {Number}  必填，当前小时（0-23），透传给 TimelineMarker
      - isLoading    {Boolean} 可选，true 时显示加载遮罩，默认 false

    Emits：
      - select-task(task)  用户点击日程卡片时触发，携带任务对象
      - edit-task(task)    用户触发编辑操作时触发，携带任务对象

    Expose：
      - timelineContainer  ScrollArea 内部 viewport DOM 元素
        （供父组件 DayView 调用 scrollTo 定位到当前时刻）

    依赖：
      - useDayData()        → dailySchedule：聚合后的当天日程数组
      - ScrollArea          UI 滚动容器
      - TaskItem            单条日程卡片组件
      - TimelineMarker      当前时刻指示线组件

    布局算法（displaySchedule computed）：
      采用贪心"列填充"策略处理同一时间段内相互重叠的日程：
        1. 按开始时间升序、持续时长降序排序
        2. 用 columns 数组维护若干"列"，每列保证相邻任务不重叠
        3. 为每个任务分配 _col（所在列索引）和 _numCols（总列数）
           让 TaskItem 据此计算 left/width，实现并排显示
        4. 当一组重叠事件全部结束（lastEventEnding）后清空列缓冲，
           进入下一组独立区间的处理
  =====================================================================-->
  <ScrollArea ref="timelineContainerRef" class="flex-1 bg-linear-to-br from-zinc-50/50 to-zinc-100/30 relative">
    <!-- 加载遮罩：isLoading 为 true 时以毛玻璃效果覆盖整个时间轴 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 bg-background/40 backdrop-blur-xs transition-all duration-700"
    ></div>
    <!-- 时间轴主容器：z-10 置于背景刻度线之上；--hour-height 决定每小时格的高度 -->
    <div class="relative z-10 px-2 sm:px-4 md:px-10 lg:px-20 py-10 min-h-[600vh] timeline-wrapper" :style="{ '--hour-height': 'max(25vh, 180px)' }">
      <!-- 背景时间轴线 -->
      <!-- 遍历 24 小时，渲染水平分隔线与时刻标签。
           每 3 小时（h % 3 === 0）加深颜色以增强视觉节奏感。
           每小时格子高度由 CSS 变量 --hour-height 统一控制，
           便于后续 TaskItem 通过同一变量计算绝对定位的 top/height。-->
      <div class="absolute inset-x-0 top-0 z-0 px-2 sm:px-4 md:px-10 lg:px-20">
        <div 
          v-for="h in 24" 
          :key="h" 
          :id="`hour-${h-1}`"
          class="border-b transition-colors duration-300 flex items-start pt-3"
          :class="h % 3 === 0 ? 'border-border/60' : 'border-border/30'"
          :style="{ height: 'var(--hour-height)' }"
        >
          <!-- 小时标签区：圆点 + 时刻文字 (HH:00)，整点 3 的倍数时加强显示 -->
          <div class="flex items-center gap-3 sm:-ml-2">
            <div
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="h % 3 === 0 ? 'bg-primary/40 shadow-sm' : 'bg-muted-foreground/20'"
            ></div>
            <span
              class="text-[11px] font-mono font-bold tracking-tight transition-colors duration-300"
              :class="h % 3 === 0 ? 'text-foreground/70' : 'text-muted-foreground/40'"
            >
              <!-- h 从 1 开始循环，显示时需减 1 得到 00:00 ~ 23:00 -->
              {{ String(h-1).padStart(2, '0') }}:00
            </span>
          </div>
        </div>
      </div>

      <!-- 渲染具体日程项目 (TaskItem 组件) -->
      <!-- displaySchedule 已经过重叠布局算法处理，每条任务携带
           _col / _numCols / _originalIndex 等布局元数据，由 TaskItem 负责消费。
           key 使用 _originalIndex 保证 Vue diff 的稳定性。 -->
      <template v-for="item in displaySchedule" :key="item._originalIndex">
        <TaskItem
          :task="item"
          :index="item._originalIndex"
          @select="$emit('select-task', $event)"
          @edit="$emit('edit-task', $event)"
        />
      </template>
      
      <!-- 当前时间指示线 (TimelineMarker 组件) -->
      <!-- 传入 currentHour，由 TimelineMarker 内部计算精确定位（含分钟偏移） -->
      <TimelineMarker :current-hour="currentHour" />
    </div>
  </ScrollArea>
</template>

<!--
  =========================================================================
  Timeline.vue <script setup>
  =========================================================================
-->
<script setup>
import { ref, computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import TaskItem from '@/views/day/components/TaskItem.vue'
import TimelineMarker from '@/views/day/components/TimelineMarker.vue'
import { useDayData } from '@/views/day/composables/useDayData'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps({
  /** 当前小时（0-23），用于驱动 TimelineMarker 位置 */
  currentHour: {
    type: Number,
    required: true
  },
  /** 是否正在加载数据，true 时显示毛玻璃遮罩 */
  isLoading: {
    type: Boolean,
    default: false
  }
})

// ── 数据源 ────────────────────────────────────────────────────────────────
// dailySchedule：由 useDayData 聚合 Task / DailyPlan / Habit 三种数据源
const { dailySchedule } = useDayData()

// ── 布局算法：计算相互重叠的日程使其并排显示 ──────────────────────────────
/**
 * displaySchedule
 * 对 dailySchedule 进行"贪心列分配"预处理，使重叠的日程能并排展示。
 *
 * 算法步骤：
 *   1. 为每条任务注入 _originalIndex，避免排序后索引错位影响 select/edit 回调
 *   2. 过滤掉没有 startHour 的任务（全天事项或数据异常项）
 *   3. 按 startHour 升序、durationHours 降序排序（长任务优先占列，减少列数）
 *   4. 维护 columns 数组（每列是一个任务数组），按贪心策略为每条任务找列：
 *        - 若某列最后一条任务已结束（endHour <= 当前任务 startHour），则插入该列
 *        - 否则新开一列
 *   5. 当检测到新任务的 startHour >= 上一组事件的 lastEventEnding，
 *      说明进入了一个全新的不重叠区间，调用 packEvents 提交当前列组，然后清空
 *   6. packEvents：将列索引 _col 和总列数 _numCols 写入每条任务，
 *      TaskItem 据此计算 left / width 百分比实现并排
 *
 * @returns {Array} 经过布局元数据注入的任务数组
 */
const displaySchedule = computed(() => {
  // 注入原始 index，以防改变日常排序后导致点击选区或编辑触发的下标错误
  const tasks = dailySchedule.value
    .map((t, idx) => ({ ...t, _originalIndex: idx }))
    .filter(t => t.startHour !== undefined)
  
  // 基于开始时间和持续时长做二次排序
  tasks.sort((a, b) => a.startHour - b.startHour || (b.durationHours || 1) - (a.durationHours || 1))

  /** 当前重叠区间的列组，每列为一个任务数组 */
  let columns = []
  /** 当前重叠区间中所有任务的最晚结束时刻（小时），用于检测区间边界 */
  let lastEventEnding = null
  
  tasks.forEach((task) => {
    // 若新任务在当前区间结束之后开始，则提交当前列组并重置
    if (lastEventEnding !== null && task.startHour >= lastEventEnding) {
        packEvents(columns)
        columns = []
        lastEventEnding = null
    }
    let placed = false
    const dur = task.durationHours || 1
    // 遍历已有列，找到第一个"尾部任务已结束"的列放入
    for (let col of columns) {
      const lastInCol = col[col.length - 1]
      const lastDur = lastInCol.durationHours || 1
      if (lastInCol.startHour + lastDur <= task.startHour) {
        col.push(task)
        placed = true
        break
      }
    }
    // 所有列均与当前任务重叠，新开一列
    if (!placed) {
      columns.push([task])
    }
    // 更新当前区间的最晚结束时刻
    if (lastEventEnding === null || task.startHour + dur > lastEventEnding) {
      lastEventEnding = task.startHour + dur
    }
  })
  
  // 处理最后一组列（循环结束后不会再触发区间检测，需手动提交）
  if (columns.length > 0) {
     packEvents(columns)
  }
  
  return tasks
})

/**
 * packEvents - 将列布局元数据写入任务对象
 *
 * 在一组重叠事件处理完毕后调用。
 * 遍历所有列，为每条任务注入：
 *   - _col     {number} 该任务所在列的索引（0-based）
 *   - _numCols {number} 当前重叠区间共有多少列
 *
 * TaskItem 根据这两个值计算绝对定位的 left 和 width，实现并排布局。
 *
 * @param {Array[]} columns - 二维数组，外层为列，内层为任务
 */
function packEvents(columns) {
  const numCols = columns.length
  columns.forEach((col, i) => {
    col.forEach(t => {
      t._col = i        // 列索引，决定 left 百分比
      t._numCols = numCols // 总列数，决定 width 百分比
    })
  })
}

// ── Refs ──────────────────────────────────────────────────────────────────
/** ScrollArea 组件实例引用，用于 expose 出 viewport DOM 供父组件滚动定位 */
const timelineContainerRef = ref(null)

// ── Expose ────────────────────────────────────────────────────────────────
/**
 * 向父组件暴露 ScrollArea 的内部 viewport 元素。
 * DayView 在页面初始化时调用 timelineContainer.scrollTo(...)
 * 将视图定位到当前时刻附近。
 */
defineExpose({
  timelineContainer: computed(() => timelineContainerRef.value?.viewportElement)
})

// ── Emits ─────────────────────────────────────────────────────────────────
defineEmits(['edit-task', 'select-task'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

/* timeline-wrapper 使用 CSS 自定义属性 --timeline-left 控制日程卡片
   在不同屏幕尺寸下的左边距，与背景刻度线的缩进保持对齐。
   TaskItem 通过 var(--timeline-left) 定位自身的水平起点。 */
.timeline-wrapper {
  --timeline-left: 1.5rem; /* ~ pl-6 */
}
@media (min-width: 640px) {
  .timeline-wrapper {
    --timeline-left: 6rem; /* ~ pl-24 */
  }
}
@media (min-width: 768px) {
  .timeline-wrapper {
    --timeline-left: 9rem; /* ~ pl-36 */
  }
}
</style>
