<template>
  <header class="picker-root">
    <div class="picker-title">
      <span class="picker-caption">当前关注</span>
      <h2 class="picker-title-text">{{ selectedGoalName }}</h2>
    </div>

    <Card class="picker-card">
      <CardContent class="picker-card-content">
        <div class="picker-row">
          <div class="picker-range">
            <span class="picker-range-label">执行时轴</span>
            <div class="picker-range-value">
              <span class="picker-month">{{ months[startMonth - 1].label }}</span>
              <span class="picker-sep">到</span>
              <span class="picker-month">{{ months[endMonth - 1].label }}</span>
            </div>
          </div>

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

        <div class="timeline">
          <div class="timeline-track"></div>
          <div class="timeline-range" :style="rangeStyle"></div>

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

          <Transition name="bounce-up">
            <div v-if="hasChanges" class="confirm-wrap">
              <button class="confirm-button" @click="handleConfirm">
                <span>确认修改</span>
                <Check class="confirm-icon" :stroke-width="3" />
              </button>
            </div>
          </Transition>
        </div>
      </CardContent>
    </Card>
  </header>
</template>

/**
 * GoalRangePicker.vue - 目标时间范围选择器
 * 
 * 功能说明：
 * 该组件用于在「方向/目标管理」模块中选择目标的有效时间范围（开始月份和结束月份）。
 * 用户通过可视化的时间轴交互，直观地设置目标的执行时轴。
 * 
 * 工作原理：
 * 1. 从 useDirectionGoals 获取当前选中的目标 (selectedGoal) 和月份配置 (months)
 * 2. 从 useDirectionState 获取月度计划缓存 (monthlyPlansCache)，从中计算当前目标的实际月份范围
 * 3. 使用 localStart/localEnd 两个 ref 记录用户本地选择的范围（支持取消/重选）
 * 4. 当用户点击时间轴上的月份时，交替设置开始和结束月份
 * 5. 用户确认后，调用 handleConfirmRange 提交修改到全局状态
 * 
 * 状态流向：
 * selectedGoal (全局) → monthRange (计算属性，来源于缓存) → localStart/localEnd (本地状态)
 *                                                      ↓
 *                                            用户在时间轴上交互
 *                                                      ↓
 *                              hasChanges (检测是否有未保存的修改)
 *                                                      ↓
 *                              handleConfirm (确认修改，提交到全局)
 * 
 * 交互逻辑：
 * - 点击月份时，先设置开始月份（start picker），再设置结束月份（end picker），交替进行
 * - 如果开始月份大于结束月份，自动将结束月份调整为开始月份
 * - 只有当本地选择与缓存中的范围不一致时，才显示「确认修改」按钮
 */

<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { computed, ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-vue-next'

// 从目标管理 composable 获取：当前选中目标、月度数据、激活的拾取器、确认回调
const { selectedGoal, months, activePicker, handleConfirmRange } = useDirectionGoals()

// 从方向状态 composable 获取：月度计划缓存（key 为 plan_id）
const { monthlyPlansCache } = useDirectionState()

/**
 * monthRange - 从月度计划缓存计算当前目标的月份范围
 * 
 * 计算逻辑：
 * 1. 获取 selectedGoal 对应的 plan_id，从缓存中查找该计划的所有月度记录
 * 2. 提取每个记录的月份数字（去除日期部分，只保留月）
 * 3. 返回最小月份作为开始月，最大月份作为结束月
 * 
 * 边界情况：
 * - 无选中目标时返回 { start: 1, end: 1 }
 * - 缓存为空或无有效月份时返回 { start: 1, end: 1 }
 */
const monthRange = computed(() => {
  if (!selectedGoal.value) return { start: 1, end: 1 }
  // monthlyPlansCache 以 plan_id 为 key，存储该计划下所有月度计划
  const cached = monthlyPlansCache[selectedGoal.value.plan_id] || []
  if (cached.length === 0) return { start: 1, end: 1 }

  // 提取每个月度计划的月份数字，filter 过滤掉 null 值
  const monthNums = cached
    .map(mp => getDateOnlyMonth(mp.month))
    .filter(m => m !== null)

  if (monthNums.length === 0) return { start: 1, end: 1 }
  // Math.min/max 接收展开的参数数组，计算出实际月份范围
  return { start: Math.min(...monthNums), end: Math.max(...monthNums) }
})

// 便捷访问器，供模板直接使用
const startMonth = computed(() => monthRange.value.start)
const endMonth = computed(() => monthRange.value.end)

// 当前选中目标的名称，用于页面标题展示
const selectedGoalName = computed(() => selectedGoal.value?.name ?? '')

/**
 * localStart / localEnd - 用户本地选择的月份范围
 * 
 * 用途：支持用户自由调整选择，在确认前不会直接影响全局状态
 * - 初始化为 1（1月），等待 monthRange watch 更新
 * - 当用户点击时间轴月份时，会更新这两个值
 * - 只有当这两个值与 monthRange 不一致时，才显示确认按钮
 */
const localStart = ref(1)
const localEnd = ref(1)

/**
 * 监听 selectedGoal 变化
 * 
 * 触发时机：用户切换到另一个目标时
 * 作用：将本地选择重置为新目标的默认月份范围
 * 配置：immediate: true 确保组件创建时就执行一次
 *       deep: true 深度监听，因为 selectedGoal 是对象引用
 */
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

/**
 * 监听 monthRange 变化
 * 
 * 触发时机：monthlyPlansCache 更新导致 monthRange 重新计算时
 * 作用：当后端数据变化时，同步更新本地显示的范围
 * 注意：此时用户可能正在选择，所以会覆盖用户的本地选择
 */
watch(monthRange, (range) => {
  localStart.value = range.start
  localEnd.value = range.end
})

/**
 * hasChanges - 检测用户是否有未保存的修改
 * 
 * 返回值：
 * - selectedGoal 为 null 时返回 false（无目标时不显示确认按钮）
 * - localStart !== monthRange.start 或 localEnd !== monthRange.end 时返回 true
 * 
 * 用途：控制「确认修改」按钮的显示/隐藏
 */
const hasChanges = computed(() => {
  if (!selectedGoal.value) return false
  return localStart.value !== monthRange.value.start || localEnd.value !== monthRange.value.end
})

/**
 * isMonthActive - 判断某月份是否为当前范围的端点（开始或结束）
 * 
 * @param {number} m - 月份数字 (1-12)
 * @returns {boolean} - 如果是 localStart 或 localEnd 返回 true
 */
const isMonthActive = (m) => localStart.value === m || localEnd.value === m

/**
 * isWithinRange - 判断某月份是否在当前选择的范围内
 * 
 * @param {number} m - 月份数字 (1-12)
 * @returns {boolean} - 如果 localStart <= m <= localEnd 返回 true
 * 
 * 用于时间轴上月份高亮样式的控制
 */
const isWithinRange = (m) => m >= localStart.value && m <= localEnd.value

/**
 * rangeStyle - 计算时间轴高亮条的位置和宽度样式
 * 
 * 计算方式：
 * - left: (localStart - 1) / 11 * 100% — 将月份 1-12 映射到 0%-100%
 *   - 1月对应 0%，12月对应 100%
 * - width: (localEnd - localStart) / 11 * 100% — 高亮条宽度
 *   - 如果开始和结束相同，宽度为 0（只显示一个点）
 * 
 * 使用 11 而非 12 的原因：
 * - 12 个月份之间有 11 个间隔
 * - 这样 1月(left=0%) 和 12月(left=100%) 刚好对齐时间轴两端
 */
const rangeStyle = computed(() => ({
  left: `${((localStart.value - 1) / 11) * 100}%`,
  width: `${((localEnd.value - localStart.value) / 11) * 100}%`
}))

/**
 * selectMonth - 处理月份选择点击事件
 * 
 * 交互逻辑（交替选择模式）：
 * 1. 当 activePicker === 'start' 时：
 *    - 将 localStart 设置为点击的月份 m
 *    - 如果 m > localEnd，自动将 localEnd 调整为 m（防止开始 > 结束）
 *    - 切换 activePicker 为 'end'，下一次点击将设置结束月份
 * 
 * 2. 当 activePicker === 'end' 时：
 *    - 将 localEnd 设置为点击的月份 m
 *    - 如果 m < localStart，自动将 localStart 调整为 m（防止结束 < 开始）
 *    - 切换 activePicker 为 'start'，下一次点击将设置开始月份
 * 
 * 这种交替模式让用户按顺序点击两个月份来完成范围选择
 * 
 * @param {number} m - 被点击的月份数字 (1-12)
 */
const selectMonth = (m) => {
  if (activePicker.value === 'start') {
    // 开始月份选择模式
    if (m > localEnd.value) localEnd.value = m // 防止开始月份大于结束月份
    localStart.value = m
    activePicker.value = 'end' // 切换到结束月份选择模式
  } else {
    // 结束月份选择模式
    if (m < localStart.value) localStart.value = m // 防止结束月份小于开始月份
    localEnd.value = m
    activePicker.value = 'start' // 切换回开始月份选择模式
  }
}

/**
 * handleConfirm - 确认用户选择的时间范围
 * 
 * 调用时 机：用户点击「确认修改」按钮时
 * 作用：将本地选择的月份范围 { start, end } 提交到 useDirectionGoals
 *       由后者处理全局状态的更新
 */
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
