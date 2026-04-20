<!--
  ============================================
  Direction 移动端目标抽屉 (DirectionMobileGoalSheet.vue)
  ============================================

  【模块职责】
  - 移动端底部抽屉
  - 包含：目标列表（DirectionSidebar 内容）+ 月度归档（MissionArchive 内容）
  - 支持触摸手势滑动打开/关闭

  【抽屉结构】
  - DirectionSidebar 目标列表 → 月度进度
  - GoalRangePicker → 月份范围选择
  - MissionArchive → 月度归档
-->
<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div
      v-if="show"
      class="fixed inset-0 z-[240] bg-black/40 backdrop-blur-[2px]"
      @click="$emit('update:show', false)"
    ></div>

    <!-- 抽屉容器 -->
    <div
      class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 85vh;"
    >
      <!-- 顶部拉手区域 -->
      <div
        class="py-4 flex justify-center shrink-0 cursor-pointer"
        @click="$emit('update:show', false)"
      >
        <div class="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <!-- 抽屉内容 -->
      <div class="flex flex-col flex-1 overflow-hidden px-5 pb-10">
        <!-- Tab 切换：目标列表 / 月度归档 -->
        <div class="flex gap-2 mb-6 shrink-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            :class="activeTab === tab.id
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 滚动内容区 -->
        <div class="flex-1 overflow-y-auto">
          <!-- 目标列表 Tab -->
          <div v-if="activeTab === 'goals'" class="flex flex-col gap-6">
            <!-- 目标列表内容 -->
            <div class="group-list">
              <div v-for="group in categorizedGoals" :key="group.category" class="group-block">
                <div class="group-header">
                  <p class="group-label">{{ group.category }}</p>
                </div>
                <div class="goal-list">
                  <button
                    v-for="goal in group.items"
                    :key="goal.plan_id"
                    class="goal-button"
                    :class="{ 'is-active': selectedGoalName === goal.name }"
                    @click="selectGoal(goal); $emit('update:show', false)"
                    @dblclick="handleEditGoal(goal)"
                  >
                    <div class="goal-row">
                      <h4 class="goal-title" :class="{ 'is-active': selectedGoalName === goal.name }">
                        {{ goal.name }}
                      </h4>
                      <div class="goal-settings" @click.stop="handleEditGoal(goal)">
                        <Settings2 class="goal-settings-icon" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- 月度进度 -->
            <div class="progress-section">
              <div class="footer-metric">
                <span class="footer-label">本月进度</span>
                <span class="footer-value">{{ systemLoad }}%</span>
              </div>
              <Progress :model-value="systemLoad" class="progress-bar" />
            </div>
          </div>

          <!-- 月度归档 Tab -->
          <div v-else-if="activeTab === 'archive'" class="flex flex-col gap-4">
            <ArchiveHeader
              :month-name="selectedMonth ? months[selectedMonth - 1].full : '无内容'"
              :task-count="datesWithTasks.length"
              :selected-month="selectedMonth"
            />
            <div class="archive-list">
              <div class="archive-line"></div>
              <TransitionGroup name="task-list">
                <ArchiveItem
                  v-for="day in datesWithTasks"
                  :key="day"
                  :day="day"
                  :task="dailyTasks[dayTaskKey(day)]"
                  :task-key="dayTaskKey(day)"
                  @update-task="(task, payload) => handleUpdateTask(task, payload)"
                />
              </TransitionGroup>
            </div>
            <div v-if="datesWithTasks.length === 0" class="archive-empty">
              <p class="archive-empty-text">暂无归档内容</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

/**
 * ============================================================================
 * DirectionMobileGoalSheet.vue - 移动端目标抽屉组件
 * ============================================================================
 * 
 * 【文件职责】
 * 移动端底部抽屉组件，作为 Direction 模块在移动设备上的入口。
 * 采用底部抽屉（Bottom Sheet）设计模式，支持触摸手势操作。
 * 
 * 【核心功能】
 * 1. 目标列表展示 - 展示所有目标，按分类分组，支持选中、编辑
 * 2. 月度进度展示 - 显示选中目标当月的完成进度百分比
 * 3. 月度归档查看 - 按日期展示已完成的任务归档列表
 * 4. Tab 切换 - 通过 Tab 切换目标列表与月度归档两个视图
 * 
 * 【数据流】
 * - useDirectionFetch       → 获取分类后的目标列表 (categorizedGoals)
 * - useDirectionSelection   → 管理选中目标、选中月份、任务数据
 * - useDirectionGoals       → 处理目标编辑操作
 * - useDirectionTasks       → 处理任务更新操作
 * 
 * 【组件状态】
 * - show        → 控制抽屉显示/隐藏，通过 v-model:show 双向绑定
 * - isLoading   → 加载状态（当前未使用，预留）
 * - activeTab   → 当前激活的 Tab: 'goals' | 'archive'
 * 
 * 【事件】
 * - update:show → 通知父组件抽屉显示状态变更
 * 
 * 【样式说明】
 * - 使用 Tailwind CSS 4 的 @apply 语法
 * - 抽屉最大高度 85vh，避免遮挡顶部内容
 * - 底部安全区域适配 (pb-safe)
 * - 圆角顶部 2.5rem，符合移动端抽屉设计规范
 * 
 * @see {@link https://github.com/lucide/lucide Lucide Icons}
 * @see {@link https://vuejs.org/guide/built-in-components.html#teleport Teleport 组件}
 */

<script setup>
/**
 * ============================================================================
 * 依赖导入
 * ============================================================================
 */

// Vue 核心响应式 API
import { ref, computed } from 'vue'

// Lucide 图标库 - 提供可定制的 SVG 图标
import { Settings2 } from 'lucide-vue-next'

// ---------------------------------------------------------------------------
// Direction 模块 Composables - 遵循项目"逻辑外置"规范
// ---------------------------------------------------------------------------

/**
 * useDirectionFetch
 * 职责：获取并处理目标数据，返回按分类分组的目标列表
 * 返回：categorizedGoals - 包含分类信息和每个分类下的目标项
 */
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

/**
 * useDirectionSelection
 * 职责：管理当前选中状态，包括：
 * - selectedGoal     → 当前选中的目标对象
 * - selectGoal()     → 选中目标的方法
 * - selectedMonth    → 当前查看的月份（1-12）
 * - datesWithTasks   → 当月有任务的日期数组
 * - dailyTasks       → 每日任务映射表 { date: task[] }
 * - dayTaskKey()     → 生成日期任务唯一 key 的方法
 */
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'

/**
 * useDirectionGoals
 * 职责：目标相关的业务操作
 * - handleEditGoal() → 打开目标编辑弹窗
 * - months           → 月份名称数组（用于归档标题显示）
 */
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'

/**
 * useDirectionTasks
 * 职责：任务相关的业务操作
 * - handleUpdateTask() → 更新任务数据
 */
import { useDirectionTasks } from '@/views/direction/composables/useDirectionTasks'

// ---------------------------------------------------------------------------
// 状态与工具函数
// ---------------------------------------------------------------------------

/**
 * getMonthlyPlansByPlanId
 * 来源：useDirectionState
 * 职责：根据 plan_id 查询该目标下所有月度计划
 * 用途：在计算月度进度时查找对应月份的计划
 */
import { getMonthlyPlansByPlanId } from '@/views/direction/composables/useDirectionState'

/**
 * getDateOnlyMonth
 * 来源：dateOnly 工具
 * 职责：提取 date 对象中的月份数字 (1-12)
 */
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'

/**
 * isDailyPlanCompleted
 * 来源：dailyPlanStatus 工具
 * 职责：判断单日计划是否已完成（用于进度计算）
 */
import { isDailyPlanCompleted } from '@/utils/dailyPlanStatus'

/**
 * getDirectionMonthlyProgress
 * 来源：progress 工具
 * 职责：计算指定目标、指定月份的完成进度百分比
 */
import { getDirectionMonthlyProgress } from '@/views/direction/utils/progress'

// ---------------------------------------------------------------------------
// UI 组件
// ---------------------------------------------------------------------------

/**
 * Progress - shadcn-vue 进度条组件
 * 用于展示月度完成进度
 */
import { Progress } from '@/components/ui/progress'

/**
 * ArchiveHeader - 月度归档头部组件
 * 显示月份名称和任务数量
 */
import ArchiveHeader from '@/views/direction/components/ArchiveHeader.vue'

/**
 * ArchiveItem - 月度归档项组件
 * 显示单日任务列表，支持任务更新
 */
import ArchiveItem from '@/views/direction/components/ArchiveItem.vue'

/* ============================================================================
 * 组件 Props & Emits 定义
 * ============================================================================ */

/**
 * props.show - 控制抽屉显示/隐藏
 * 类型：Boolean
 * 父组件通过 v-model:show 绑定
 */
const props = defineProps({
  show: Boolean,
  isLoading: Boolean  // 预留：加载状态（当前未使用）
})

/**
 * emit - 定义组件向上传递的事件
 * update:show - 抽屉显示状态变更事件
 */
const emit = defineEmits(['update:show'])

/* ============================================================================
 * Composables 实例化 - 从状态管理层获取数据和方法
 * ============================================================================ */

/**
 * 获取分类后的目标列表
 * 结构：[{ category: '工作', items: [...] }, { category: '生活', items: [...] }]
 */
const { categorizedGoals } = useDirectionFetch()

/**
 * 获取选中状态和选择方法
 * selectedGoal: 当前选中的目标
 * selectedMonth: 当前查看的月份 (1-12)
 * datesWithTasks: 当月有任务的日期列表
 * dailyTasks: 每日任务映射 { 'YYYY-MM-DD': task[] }
 * dayTaskKey: 生成日期字符串用于索引 dailyTasks
 */
const { 
  selectedGoal, 
  selectGoal, 
  selectedMonth, 
  datesWithTasks, 
  dailyTasks, 
  dayTaskKey 
} = useDirectionSelection()

/**
 * 获取目标编辑方法
 * handleEditGoal: 打开目标编辑弹窗
 */
const { handleEditGoal } = useDirectionGoals()

/**
 * 获取任务更新方法
 * handleUpdateTask: 处理任务更新操作
 */
const { handleUpdateTask } = useDirectionTasks()

/**
 * 获取月份名称数组
 * 结构：['一月', '二月', ..., '十二月']
 * 用于归档页面显示月份名称
 */
const { months } = useDirectionGoals()

/* ============================================================================
 * 组件内部状态
 * ============================================================================ */

/**
 * tabs - Tab 切换配置
 * id: Tab 唯一标识（用于 activeTab 判断）
 * label: Tab 显示文本
 */
const tabs = [
  { id: 'goals', label: '目标' },
  { id: 'archive', label: '归档' }
]

/**
 * activeTab - 当前激活的 Tab
 * 默认值：'goals'（目标列表）
 * 可选值：'goals' | 'archive'
 */
const activeTab = ref('goals')

/* ============================================================================
 * 计算属性 - Computed
 * ============================================================================ */

/**
 * selectedGoalName
 * 功能：获取当前选中目标的名称
 * 用途：与目标列表项的选中状态对比，控制高亮样式
 * 来源：从 selectedGoal 响应式对象中提取 name
 */
const selectedGoalName = computed(() => selectedGoal.value?.name || '')

/**
 * systemLoad
 * 功能：计算选中目标在当前月份的完成进度
 * 
 * 计算逻辑：
 * 1. 前提条件：必须同时选中目标和月份
 * 2. 根据 selectedGoal.plan_id 查找对应的月度计划
 * 3. 在月度计划中找到 selectedMonth 对应的那个月计划
 * 4. 调用 getDirectionMonthlyProgress 计算完成百分比
 * 
 * 返回值：0-100 的数字，表示完成进度百分比
 */
const systemLoad = computed(() => {
  // 前置检查：必须同时有选中目标和选中月份
  if (!selectedGoal.value || !selectedMonth.value) return 0

  // 获取选中目标的 plan_id 和当前月份
  const planId = selectedGoal.value.plan_id
  const month = selectedMonth.value

  // 查找该目标下指定月份的月度计划
  const monthPlan = getMonthlyPlansByPlanId(planId).find(
    mp => getDateOnlyMonth(mp.month) === month
  )

  // 如果该月份没有计划，返回 0% 进度
  if (!monthPlan) return 0

  // 计算并返回月度完成进度
  // 传入：dailyTasks（每日任务）、planId、month、完成判断函数
  return getDirectionMonthlyProgress({
    dailyTasks,
    planId,
    month,
    isDailyPlanCompleted
  })
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.group-list {
  @apply flex flex-col gap-6;
}

.group-block {
  @apply flex flex-col gap-2;
}

.group-header {
  @apply flex items-center gap-2 mb-3;
}

.group-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-[0.02em];
}

.goal-list {
  @apply flex flex-col gap-2;
}

.goal-button {
  @apply flex flex-col items-start gap-1 p-3 rounded-lg transition-all text-left;
}

.goal-button.is-active {
  @apply bg-secondary ring-1 ring-border shadow-sm;
}

.goal-row {
  @apply flex items-center justify-between w-full gap-3;
}

.goal-title {
  @apply text-sm font-semibold tracking-tight transition-colors flex-1 truncate text-muted-foreground;
}

.goal-title.is-active {
  @apply text-foreground;
}

.goal-settings {
  @apply opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-zinc-200/50;
}

.goal-button:hover .goal-settings {
  @apply opacity-100;
}

.goal-settings-icon {
  @apply w-3.5 h-3.5 text-muted-foreground;
}

.progress-section {
  @apply p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/50;
}

.footer-metric {
  @apply flex justify-between items-center mb-2;
}

.footer-label {
  @apply text-[10px] font-medium text-muted-foreground uppercase tracking-widest;
}

.footer-value {
  @apply text-[10px] font-bold text-primary;
}

.progress-bar {
  @apply h-1;
}

.archive-list {
  @apply flex flex-col relative;
}

.archive-line {
  @apply absolute left-5 top-4 bottom-4 w-px bg-zinc-100;
}

.archive-empty {
  @apply h-48 flex flex-col items-center justify-center text-center p-6 border border-zinc-100 rounded-xl bg-zinc-50/30;
}

.archive-empty-text {
  @apply text-sm text-muted-foreground;
}

.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
