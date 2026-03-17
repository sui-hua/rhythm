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
  endSelection
} = useDirectionSelection()
const { batchInput, applyBatchTask, handleBatchDelete } = useDirectionBatch()

const getMonthOffset = (m) => {
  const year = new Date().getFullYear()
  const date = new Date(year, m - 1, 1)
  return date.getDay()
}

const selectWeekDay = (m, weekIndex) => {
  const year = new Date().getFullYear()
  const daysInMonth = new Date(year, m, 0).getDate()

  const targetDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, m - 1, d).getDay()
    if (dayOfWeek === weekIndex) {
      targetDays.push(d)
    }
  }

  const currentSelection = selectedDates[m] || []
  const isAllSelected = targetDays.every(d => currentSelection.includes(d))

  let newSelection
  if (isAllSelected) {
    newSelection = currentSelection.filter(d => !targetDays.includes(d))
  } else {
    newSelection = [...new Set([...currentSelection, ...targetDays])]
  }

  selectedDates[m] = newSelection.sort((a, b) => a - b)
}

const isAllSelectedDatesHaveTask = (m) => {
  const dates = selectedDates[m] || []
  if (dates.length === 0) return false
  return dates.every(day => hasTask(m, day))
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
@reference "tailwindcss/utilities";

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
