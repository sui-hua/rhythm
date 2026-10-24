<template>
  <div class="p-6 space-y-8 animate-in slide-in-from-top-2 border-t bg-background/50">
    <div class="grid grid-cols-7 gap-2 mb-2 text-center">
      <div
        v-for="wk in weekdays"
        :key="wk.label"
        class="text-[10px] font-bold text-muted-foreground opacity-50 cursor-pointer hover:text-primary hover:opacity-100 transition-all select-none py-1 rounded-sm hover:bg-muted/50"
        @click="selectWeekDay(month, wk.dayIndex)"
      >
        {{ wk.label }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-2 place-items-center" @mousedown.stop @mouseleave="endSelection">
      <div v-for="offset in getMonthOffset(month)" :key="`spacer-${month}-${offset}`" class="aspect-square md:h-10"></div>

      <div
        v-for="day in getDaysInMonthForMonth(month)"
        :key="`grid-${day}`"
        class="aspect-square md:h-10 rounded-md border flex items-center justify-center cursor-pointer transition-all select-none text-[10px] font-bold relative bg-background border-border text-muted-foreground hover:border-primary/50"
        :class="[
          isSelected(month, day) ? 'bg-primary border-primary text-primary-foreground shadow-sm' : hasTask(month, day) ? 'bg-secondary border-transparent text-secondary-foreground' : '',
          !canSelect(month, day) ? 'cursor-not-allowed opacity-30 hover:border-transparent' : ''
        ]"
        @mousedown="startSelection(day)"
        @mouseenter="handleMouseEnter(day)"
      >
        {{ day }}
        <div v-if="hasTask(month, day)" class="absolute bottom-1 w-1 h-1 rounded-full" :class="isSelected(month, day) ? 'bg-primary-foreground' : 'bg-primary'"></div>
      </div>
    </div>

    <Transition name="popover">
      <div v-if="(selectedDates[month]?.length ?? 0) > 0" class="bg-white text-foreground rounded-xl p-3 flex items-center gap-3 shadow-xl border border-zinc-100 ring-1 ring-black/5">
        <div class="px-4 border-r border-zinc-100 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-muted-foreground">{{ selectedDates[month]?.length }} 天选中</div>
        <Input
          class="flex-1 bg-zinc-50 border-transparent focus-visible:bg-white transition-all text-foreground h-9 shadow-sm"
          :model-value="batchInput"
          :disabled="isSubmitting"
          placeholder="批量输入任务内容..."
          @update:model-value="batchInput = String($event)"
          @keyup.enter="!isSubmitting && applyBatchTask()"
        />

        <div class="flex items-center gap-1">
          <template v-if="isAllSelectedDatesHaveTask(month)">
            <Button class="h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!batchInput.trim() || isSubmitting" @click="applyBatchTask">
              修改
            </Button>
            <Button class="h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200" :disabled="isSubmitting" @click="handleBatchDelete">
              删除
            </Button>
          </template>
          <template v-else>
            <Button class="h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!batchInput.trim() || isSubmitting" @click="applyBatchTask">
              应用
            </Button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 星期标题数组（周一到周日），dayIndex 对应 JS Date.getDay() 返回值
const weekdays = [
  { label: '周一', dayIndex: 1 },
  { label: '周二', dayIndex: 2 },
  { label: '周三', dayIndex: 3 },
  { label: '周四', dayIndex: 4 },
  { label: '周五', dayIndex: 5 },
  { label: '周六', dayIndex: 6 },
  { label: '周日', dayIndex: 0 }
]

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
  getDaysInMonthForMonth,
  selectWeekDay,
  isAllSelectedDatesHaveTask
} = useDirectionSelection()
const { batchInput, applyBatchTask, handleBatchDelete, isSubmitting } = useDirectionBatch()
</script>

<style scoped>
.popover-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.popover-enter-from { opacity: 0; transform: translateY(20px) scale(0.9); }
</style>
