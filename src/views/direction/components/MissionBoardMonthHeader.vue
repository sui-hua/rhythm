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

          <div class="month-meta">
            <div class="month-meta-item">
              <span class="month-meta-label">默认时间</span>
              <Input
                type="time"
                class="month-meta-input"
                :model-value="monthlyMainGoals[goalKey(month)]?.task_time || ''"
                @update:model-value="val => { if (monthlyMainGoals[goalKey(month)]) monthlyMainGoals[goalKey(month)].task_time = val || null }"
                @blur="() => saveMonthlyPlan(month, { task_time: monthlyMainGoals[goalKey(month)]?.task_time || null })"
                @keyup.enter="() => saveMonthlyPlan(month, { task_time: monthlyMainGoals[goalKey(month)]?.task_time || null })"
              />
            </div>
            <div class="month-meta-item">
              <span class="month-meta-label">默认时长(分)</span>
              <Input
                type="number"
                class="month-meta-input"
                :model-value="monthlyMainGoals[goalKey(month)]?.duration || ''"
                @update:model-value="val => { if (monthlyMainGoals[goalKey(month)]) monthlyMainGoals[goalKey(month)].duration = val ? parseInt(val) : null }"
                @blur="() => saveMonthlyPlan(month, { duration: monthlyMainGoals[goalKey(month)]?.duration || null })"
                @keyup.enter="() => saveMonthlyPlan(month, { duration: monthlyMainGoals[goalKey(month)]?.duration || null })"
              />
            </div>
          </div>
        </div>

        <div v-else class="month-title">
          <h3 class="month-title-text" :class="{ 'is-empty': !monthlyMainGoals[goalKey(month)]?.title }">
            {{ monthlyMainGoals[goalKey(month)]?.title || '暂无计划' }}
          </h3>
          <span v-if="monthlyMainGoals[goalKey(month)]?.task_time" class="month-time">
            {{ monthlyMainGoals[goalKey(month)]?.task_time.slice(0, 5) }} ({{ monthlyMainGoals[goalKey(month)]?.duration }}m)
          </span>
        </div>
      </div>
    </div>

    <div class="month-header-right">
      <Button class="month-toggle" variant="ghost" size="sm" @click.stop="toggleMonth(month)">
        {{ selectedMonth === month ? '收起面板' : '展开规划' }}
      </Button>
      <ChevronDown class="month-chevron" :class="{ 'is-open': selectedMonth === month }" :size="18" />
    </div>
  </div>
</template>

/**
 * MissionBoardMonthHeader.vue - 月度任务面板头部组件
 * 
 * 功能说明：
 * - 显示月度任务的标题、默认时间和时长
 * - 支持点击展开/收起月度任务编辑面板
 * - 当 selectedMonth 等于当前月份时，显示编辑模式（Input 输入框）
 * - 否则显示只读模式（月度标题和时间信息）
 * 
 * 组件结构：
 * - 左侧：月份标签 + 标题区域（编辑/只读模式）
 * - 右侧：展开/收起按钮 + 箭头图标
 * 
 * 使用场景：
 * - MissionBoard 月度任务面板中的月份分组头部
 * - 每个月份对应一个 Header，可独立展开/收起
 * 
 * Props：
 * - month: Number - 月份数字（1-12）
 * 
 * 依赖的 Composable：
 * - useDirectionGoals: 获取 monthlyMainGoals 和 saveMonthlyPlan 方法
 * - useDirectionSelection: 获取 selectedMonth、goalKey 和 toggleMonth 方法
 * 
 * 样式说明：
 * - 使用 Tailwind CSS 4 原子化类名
 * - 支持 hover 状态、过渡动画
 * - 响应式设计，移动端隐藏部分按钮文字
 */
<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
  @apply px-6 py-4 cursor-pointer flex items-center justify-between bg-zinc-50/30 transition-colors hover:bg-zinc-100/50;
}

.month-header-left {
  @apply flex items-center gap-6 flex-1 min-w-0;
}

.month-label {
  @apply text-sm font-mono font-bold text-muted-foreground shrink-0;
}

.month-title-area {
  @apply flex-1 min-w-0 max-w-xl;
}

.month-edit {
  @apply mb-1 flex flex-col gap-2;
}

.month-input {
  @apply bg-background text-lg font-semibold tracking-tight h-10 shadow-sm w-full;
}

.month-meta {
  @apply flex gap-4 items-center pl-1;
}

.month-meta-item {
  @apply flex flex-col gap-1 w-32;
}

.month-meta-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-wider;
}

.month-meta-input {
  @apply h-8 text-sm;
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
  @apply text-xs font-mono text-muted-foreground/60;
}

.month-header-right {
  @apply flex items-center gap-4;
}

.month-toggle {
  @apply h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary hidden md:flex;
}

.month-chevron {
  @apply text-muted-foreground/40 transition-transform duration-300 shrink-0;
}

.month-chevron.is-open {
  @apply rotate-180 text-primary;
}
</style>
