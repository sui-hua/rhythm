<template>
  <!--
    GoalRangePicker — 目标执行时轴选择器
    主要结构：目标名称展示、月份范围显示、开始/结束切换按钮、时间轴选择器、确认修改按钮
  -->
  <header class="picker-root">
    <!-- 目标名称展示区开始 -->
    <div class="picker-title">
      <span class="picker-caption">当前关注</span>
      <h2 class="picker-title-text">{{ selectedGoalName }}</h2>
    </div>
    <!-- 目标名称展示区结束 -->

    <!-- 月份范围选择卡片开始 -->
    <Card class="picker-card">
      <CardContent class="picker-card-content">
        <!-- 月份范围显示与切换按钮行开始 -->
        <div class="picker-row">
          <div class="picker-range">
            <span class="picker-range-label">执行时轴</span>
            <div class="picker-range-value">
              <span class="picker-month">{{ months[startMonth - 1]?.label }}</span>
              <span class="picker-sep">到</span>
              <span class="picker-month">{{ months[endMonth - 1]?.label }}</span>
            </div>
          </div>

          <!-- 开始/结束月份切换按钮，决定点击时间轴时修改的是起点还是终点 -->
          <div class="picker-toggle">
            <button
              class="toggle-button"
              :class="{ 'is-active': activePicker === 'start' }"
              @click="activePicker = 'start'"
            >
              开始月份
            </button>
            <button
              class="toggle-button"
              :class="{ 'is-active': activePicker === 'end' }"
              @click="activePicker = 'end'"
            >
              结束月份
            </button>
          </div>
        </div>
        <!-- 月份范围显示与切换按钮行结束 -->

        <!-- 操作提示 -->
        <p class="text-xs text-muted-foreground mb-2">点击选择起止月份</p>

        <!-- 时间轴选择器开始 -->
        <div class="timeline">
          <!-- 背景轨道 -->
          <div class="timeline-track"></div>
          <!-- 选中范围高亮条，通过动态样式定位 -->
          <div class="timeline-range" :style="rangeStyle"></div>

          <!-- 12 个月份节点 -->
          <div class="timeline-months">
            <div
              v-for="m in 12"
              :key="m"
              class="month-item"
              :class="{ 'is-active': isMonthActive(m), 'is-in-range': isWithinRange(m) }"
              @click="selectMonth(m)"
            >
              <span class="month-num">{{ String(m).padStart(2, '0') }}</span>
              <div class="month-dot">
                <div class="month-dot-inner"></div>
              </div>
            </div>
          </div>

          <!-- 确认修改按钮，仅在月份范围发生变化时显示 -->
          <Transition name="bounce-up">
            <div v-if="hasChanges" class="confirm-wrap">
              <button class="confirm-button" @click="handleConfirm">
                <span>确认修改</span>
                <Check class="confirm-icon" :stroke-width="3" />
              </button>
            </div>
          </Transition>
        </div>
        <!-- 时间轴选择器结束 -->
      </CardContent>
    </Card>
    <!-- 月份范围选择卡片结束 -->
  </header>
</template>

<script lang="ts" setup>
/**
 * GoalRangePicker — 目标执行时轴选择器
 * 职责：展示当前目标名称，提供可视化时间轴让用户选择执行月份范围
 * 数据流：useGoalDataStore.goalMonthsCache → monthRange（服务端数据）
 *        localStart/localEnd（本地编辑状态）→ handleConfirmRange（提交变更）
 */

// ── 依赖导入 ──
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { computed, ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-vue-next'

// ── Store ──
const dataStore = useGoalDataStore()

// ── Composables ──
// selectedGoal: 当前选中目标 | months: 月份配置 | activePicker: 当前激活的起止点 | handleConfirmRange: 提交范围变更
const { selectedGoal, months, activePicker, handleConfirmRange } = useDirectionGoals()

// ── 计算属性 ──
// 从 goalMonthsCache 提取当前目标的服务端月份范围，缓存为空时默认 { start: 1, end: 1 }
const monthRange = computed(() => {
  if (!selectedGoal.value) return { start: 1, end: 1 }
  const cached = dataStore.goalMonthsCache[selectedGoal.value.goal_id] || []
  if (cached.length === 0) return { start: 1, end: 1 }

  // 提取有效月份数字，过滤掉 null 值（日期解析失败的情况）
  const monthNums = cached
    .map(mp => getDateOnlyMonth(mp.month))
    .filter(m => m !== null)

  if (monthNums.length === 0) return { start: 1, end: 1 }
  return { start: Math.min(...monthNums), end: Math.max(...monthNums) }
})

// 服务端月份范围的起止月
const startMonth = computed(() => monthRange.value.start)
const endMonth = computed(() => monthRange.value.end)
// 当前目标名称，用于头部展示
const selectedGoalName = computed(() => selectedGoal.value?.name ?? '')

// ── 状态 ──
// 本地编辑的起止月份，与服务端数据解耦，确认后才提交
const localStart = ref(1)
const localEnd = ref(1)

// ── 侦听器 ──
// 目标切换时，同步服务端月份范围到本地状态（立即执行）
watch(
  () => selectedGoal.value,
  (val) => {
    if (val) {
      const range = monthRange.value
      localStart.value = range.start
      localEnd.value = range.end
    }
  },
  { immediate: true, deep: true }
)

// 服务端月份范围变更时（如新增月计划后），同步更新本地状态
watch(monthRange, (range) => {
  localStart.value = range.start
  localEnd.value = range.end
})

// ── 计算属性（续） ──
// 检测本地编辑是否有变更，控制确认按钮的显隐
const hasChanges = computed(() => {
  if (!selectedGoal.value) return false
  return localStart.value !== monthRange.value.start || localEnd.value !== monthRange.value.end
})

// 判断月份是否为起止端点（高亮显示）
const isMonthActive = (m: number) => localStart.value === m || localEnd.value === m
// 判断月份是否在选中范围内（范围高亮）
const isWithinRange = (m: number) => m >= localStart.value && m <= localEnd.value

// 时间轴高亮条的定位样式，基于月份位置百分比计算
const rangeStyle = computed(() => ({
  left: `${((localStart.value - 1) / 11) * 100}%`,
  width: `${((localEnd.value - localStart.value) / 11) * 100}%`
}))

// ── 方法 ──
// 选择月份：根据当前激活的起止点更新对应值，并自动切换到另一端点
// 边界处理：选择开始月份时若超过结束月份则自动扩展，反之亦然
const selectMonth = (m: number) => {
  if (activePicker.value === 'start') {
    if (m > localEnd.value) localEnd.value = m
    localStart.value = m
    activePicker.value = 'end'
  } else {
    if (m < localStart.value) localStart.value = m
    localEnd.value = m
    activePicker.value = 'start'
  }
}

// 提交月份范围变更到后端
const handleConfirm = () => {
  handleConfirmRange({ start: localStart.value, end: localEnd.value })
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.picker-root {
  @apply p-6 md:p-10 flex flex-col gap-6;
}

.picker-title {
  @apply flex flex-col gap-1;
}

.picker-caption {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1;
}

.picker-title-text {
  @apply text-3xl font-bold tracking-tight;
}

.picker-card {
  @apply border shadow-sm rounded-xl overflow-hidden bg-background;
}

.picker-card-content {
  @apply p-6 flex flex-col;
}

.picker-row {
  @apply flex items-center justify-between;
}

.picker-range {
  @apply flex flex-col gap-1;
}

.picker-range-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-widest;
}

.picker-range-value {
  @apply flex items-baseline gap-2;
}

.picker-month {
  @apply text-2xl font-bold tracking-tight;
}

.picker-sep {
  @apply text-xs text-muted-foreground font-medium;
}

.picker-toggle {
  @apply flex bg-secondary p-1 rounded-lg border;
}

.toggle-button {
  @apply px-4 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0 text-muted-foreground hover:text-foreground;
}

.toggle-button.is-active {
  @apply bg-background shadow-sm text-foreground;
}

.timeline {
  @apply relative px-2 py-4 mt-8;
}

.timeline-track {
  @apply absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-secondary rounded-full;
}

.timeline-range {
  @apply absolute top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 rounded-full;
}

.timeline-months {
  @apply relative flex justify-between;
}

.month-item {
  @apply flex flex-col items-center cursor-pointer;
}

.month-num {
  @apply text-[10px] font-mono font-bold mb-4 transition-all text-muted-foreground/30;
}

.month-dot {
  @apply w-4 h-4 rounded-full flex items-center justify-center z-10 transition-all bg-background border;
}

.month-dot-inner {
  @apply w-1.5 h-1.5 rounded-full bg-muted;
}

.month-item.is-active .month-num {
  @apply text-foreground;
}

.month-item.is-active .month-dot {
  @apply bg-primary scale-125 border-transparent;
}

.month-item.is-active .month-dot-inner {
  @apply bg-primary-foreground;
}

.month-item.is-in-range .month-num {
  @apply text-muted-foreground;
}

.month-item:hover .month-num {
  @apply text-muted-foreground;
}

.month-item:hover .month-dot-inner {
  @apply bg-muted-foreground/50;
}

.month-item.is-in-range .month-dot-inner {
  @apply bg-primary/50;
}

.confirm-wrap {
  @apply mt-8;
}

.confirm-button {
  @apply w-full inline-flex items-center justify-center gap-2 rounded-full py-2 text-xs font-bold tracking-wide bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 ring-2 ring-background;
}

.confirm-icon {
  @apply w-3.5 h-3.5 opacity-70;
}

.bounce-up-enter-active {
  animation: bounce-up-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bounce-up-leave-active {
  transition: all 0.3s ease-in;
}

.bounce-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@keyframes bounce-up-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(-8px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
</style>
