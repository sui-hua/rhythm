<template>
  <div class="month-content">
    <div class="week-header">
      <div
        v-for="(wk, index) in ['周日', '周一', '周二', '周三', '周四', '周五', '周六']"
        :key="wk"
        class="week-day"
        @click="selectWeekDay(month, index)"
      >
        {{ wk }}
      </div>
    </div>

    <div class="month-grid" @mousedown.stop @mouseleave="endSelection">
      <div v-for="offset in getMonthOffset(month)" :key="`spacer-${month}-${offset}`" class="day-spacer"></div>

      <div
        v-for="day in 31"
        :key="`grid-${day}`"
        class="day-cell"
        :class="{
          'is-selected': isSelected(month, day),
          'has-task': hasTask(month, day),
          'is-disabled': !canSelect(month, day)
        }"
        @mousedown="startSelection(day)"
        @mouseenter="handleMouseEnter(day)"
      >
        {{ day }}
        <div v-if="hasTask(month, day)" class="day-dot" :class="{ 'is-selected': isSelected(month, day) }"></div>
      </div>
    </div>

    <Transition name="popover">
      <div v-if="selectedDates[month]?.length > 0" class="batch-bar">
        <div class="batch-count">{{ selectedDates[month].length }} 天选中</div>
        <Input
          class="batch-input"
          :model-value="batchInput"
          placeholder="批量输入任务内容..."
          @update:model-value="batchInput = $event"
          @keyup.enter="applyBatchTask"
        />

        <div class="batch-actions">
          <template v-if="isAllSelectedDatesHaveTask(month)">
            <Button class="batch-btn-warning" :disabled="!batchInput.trim()" @click="applyBatchTask">
              修改
            </Button>
            <Button class="batch-btn-danger" @click="handleBatchDelete">
              删除
            </Button>
          </template>
          <template v-else>
            <Button class="batch-btn-primary" :disabled="!batchInput.trim()" @click="applyBatchTask">
              应用
            </Button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

/**
 * MissionBoardMonthBody - 月度任务面板主体组件
 *
 * 功能说明：
 * - 渲染月度日历网格视图，支持显示当月所有日期（1-31日）
 * - 支持日期范围多选（鼠标拖拽选择连续日期）
 * - 支持按星期筛选（点击星期表头筛选对应日期）
 * - 显示每个日期的任务状态（有任务/无任务/禁用）
 * - 提供批量任务操作（批量新增、修改、删除指定日期的任务）
 *
 * 布局结构：
 * 1. week-header: 星期表头（周日~周六），点击可按星期筛选
 * 2. month-grid: 月度日期网格，7列布局，包含：
 *    - day-spacer: 月初空白占位（对齐网格）
 *    - day-cell: 日期单元格，支持选中态、有任务态、禁用态
 * 3. batch-bar: 批量操作栏，有选中日期时显示
 *
 * 状态管理（Composables）：
 * - useDirectionSelection: 日期选择逻辑（选中、多选、范围选择、星期筛选）
 * - useDirectionBatch: 批量任务操作逻辑（批量输入、提交、删除）
 *
 * @prop {number} month - 当前月份值（1-12）
 */
<script setup>
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const { month } = defineProps({
  month: {
    type: Number,
    required: true
  }
})

const {
  selectedDates,
  hasTask,
  isSelected,
  canSelect,
  startSelection,
  handleMouseEnter,
  endSelection,
  getMonthOffset,
  selectWeekDay,
  isAllSelectedDatesHaveTask
} = useDirectionSelection()
const { batchInput, applyBatchTask, handleBatchDelete } = useDirectionBatch()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";


.month-content {
  @apply p-6 space-y-8 animate-in slide-in-from-top-2 border-t bg-background/50;
}

.week-header {
  @apply grid grid-cols-7 gap-2 mb-2 text-center;
}

.week-day {
  @apply text-[10px] font-bold text-muted-foreground opacity-50 cursor-pointer hover:text-primary hover:opacity-100 transition-all select-none py-1 rounded-sm hover:bg-muted/50;
}

.month-grid {
  @apply grid grid-cols-7 gap-2 place-items-center;
}

.day-spacer {
  @apply aspect-square md:h-10;
}

.day-cell {
  @apply aspect-square md:h-10 rounded-md border flex items-center justify-center cursor-pointer transition-all select-none text-[10px] font-bold relative bg-background border-border text-muted-foreground hover:border-primary/50;
}

.day-cell.has-task {
  @apply bg-secondary border-transparent text-secondary-foreground;
}

.day-cell.is-selected {
  @apply bg-primary border-primary text-primary-foreground shadow-sm;
}

.day-cell.is-disabled {
  @apply cursor-not-allowed opacity-30 hover:border-transparent;
}

.day-dot {
  @apply absolute bottom-1 w-1 h-1 rounded-full bg-primary;
}

.day-dot.is-selected {
  @apply bg-primary-foreground;
}

.batch-bar {
  @apply bg-white text-foreground rounded-xl p-3 flex items-center gap-3 shadow-xl border border-zinc-100 ring-1 ring-black/5;
}

.batch-count {
  @apply px-4 border-r border-zinc-100 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-muted-foreground;
}

.batch-input {
  @apply flex-1 bg-zinc-50 border-transparent focus-visible:bg-white transition-all text-foreground h-9 shadow-sm;
}

.batch-actions {
  @apply flex items-center gap-1;
}

.batch-btn-primary {
  @apply h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed;
}

.batch-btn-warning {
  @apply h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 shadow-none border border-orange-200;
}

.batch-btn-danger {
  @apply h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200;
}

.popover-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.popover-enter-from { opacity: 0; transform: translateY(20px) scale(0.9); }
</style>
