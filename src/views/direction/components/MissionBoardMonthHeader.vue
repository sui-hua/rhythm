<template>
  <div class="month-header" @click="toggleMonth(month)">
    <div class="month-header-left">
      <span class="month-label">0{{ month }}月</span>

      <div class="month-title-area">
        <div v-if="selectedMonth === month" class="month-edit" @click.stop>
          <Input
            :model-value="monthlyMainGoals[goalKey(month)]?.title || ''"
            class="month-input"
            placeholder="点此分配本月主要任务..."
            @update:model-value="val => { if (monthlyMainGoals[goalKey(month)]) monthlyMainGoals[goalKey(month)].title = val }"
            @blur="() => saveMonthlyPlan(month, { title: monthlyMainGoals[goalKey(month)]?.title })"
            @keyup.enter="() => saveMonthlyPlan(month, { title: monthlyMainGoals[goalKey(month)]?.title })"
          />

          <div class="month-meta" aria-label="月目标默认安排">
            <div class="month-meta-pill">
              <Clock3 class="month-meta-icon" :size="14" />
              <Input
                type="time"
                class="month-time-input"
                :model-value="monthlyMainGoals[goalKey(month)]?.task_time || ''"
                @update:model-value="val => { if (monthlyMainGoals[goalKey(month)]) monthlyMainGoals[goalKey(month)].task_time = val || null }"
                @blur="() => saveMonthlyPlan(month, { task_time: monthlyMainGoals[goalKey(month)]?.task_time || null })"
                @keyup.enter="() => saveMonthlyPlan(month, { task_time: monthlyMainGoals[goalKey(month)]?.task_time || null })"
              />
              <span class="month-meta-divider"></span>
              <Timer class="month-meta-icon" :size="14" />
              <Input
                type="number"
                min="1"
                class="month-duration-input"
                :model-value="monthlyMainGoals[goalKey(month)]?.duration || ''"
                @update:model-value="val => { if (monthlyMainGoals[goalKey(month)]) monthlyMainGoals[goalKey(month)].duration = val ? parseInt(val) : null }"
                @blur="() => saveMonthlyPlan(month, { duration: monthlyMainGoals[goalKey(month)]?.duration || null })"
                @keyup.enter="() => saveMonthlyPlan(month, { duration: monthlyMainGoals[goalKey(month)]?.duration || null })"
              />
              <span class="month-duration-unit">分</span>
            </div>
          </div>
        </div>

        <div v-else class="month-title">
          <h3 class="month-title-text" :class="{ 'is-empty': !monthlyMainGoals[goalKey(month)]?.title }">
            {{ monthlyMainGoals[goalKey(month)]?.title || '暂无计划' }}
          </h3>
          <span v-if="monthlyMainGoals[goalKey(month)]?.task_time" class="month-time">
            {{ monthlyMainGoals[goalKey(month)]?.task_time.slice(0, 5) }}
            <span v-if="monthlyMainGoals[goalKey(month)]?.duration" class="month-time-duration">
              {{ monthlyMainGoals[goalKey(month)]?.duration }} 分
            </span>
          </span>
        </div>
      </div>
    </div>

    <div class="month-header-right">
      <ChevronDown class="month-chevron" :class="{ 'is-open': selectedMonth === month }" :size="18" />
    </div>
  </div>
</template>

<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { ChevronDown, Clock3, Timer } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const { month } = defineProps({
  month: {
    type: Number,
    required: true
  }
})

const { monthlyMainGoals, saveMonthlyPlan } = useDirectionGoals()
const { selectedMonth, goalKey, toggleMonth } = useDirectionSelection()

</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.month-header {
  @apply px-6 py-5 cursor-pointer flex items-center justify-between bg-zinc-50/30 transition-colors hover:bg-zinc-100/50;
}

.month-header-left {
  @apply flex items-center gap-6 flex-1 min-w-0;
}

.month-label {
  @apply text-sm font-mono font-bold text-muted-foreground shrink-0;
}

.month-title-area {
  @apply flex-1 min-w-0;
}

.month-edit {
  @apply flex items-center gap-4 min-w-0;
}

.month-input {
  @apply h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-lg font-semibold tracking-tight shadow-none focus-visible:ring-1;
}

.month-meta {
  @apply flex items-center gap-2 shrink-0;
}


.month-meta-pill {
  @apply h-10 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-background px-3 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10;
}

.month-meta-icon {
  @apply text-muted-foreground/50 shrink-0;
}

.month-meta-divider {
  @apply h-4 w-px bg-zinc-200 mx-0.5;
}

.month-time-input,
.month-duration-input {
  @apply h-6 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0;
}

.month-time-input {
  @apply w-[74px] font-mono;
}

.month-duration-input {
  @apply w-8 text-center font-mono;
}

.month-duration-unit {
  @apply text-[10px] font-bold text-muted-foreground/50;
}

.month-title {
  @apply flex items-baseline gap-3;
}

.month-title-text {
  @apply text-xl font-bold tracking-tight truncate transition-all text-foreground;
}

.month-title-text.is-empty {
  @apply text-muted-foreground/30;
}

.month-time {
  @apply inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-mono text-muted-foreground/70;
}

.month-time-duration {
  @apply border-l border-zinc-300 pl-1.5 font-sans text-[10px] font-bold;
}

.month-header-right {
  @apply flex items-center shrink-0 ml-3;
}

.month-chevron {
  @apply text-muted-foreground/40 transition-transform duration-300 shrink-0;
}

.month-chevron.is-open {
  @apply rotate-180 text-primary;
}
</style>
