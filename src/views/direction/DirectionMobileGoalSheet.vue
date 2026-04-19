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

<script setup>
import { ref, computed } from 'vue'
import { Settings2 } from 'lucide-vue-next'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionTasks } from '@/views/direction/composables/useDirectionTasks'
import { getMonthlyPlansByPlanId } from '@/views/direction/composables/useDirectionState'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { Progress } from '@/components/ui/progress'
import ArchiveHeader from '@/views/direction/components/ArchiveHeader.vue'
import ArchiveItem from '@/views/direction/components/ArchiveItem.vue'
import { isDailyPlanCompleted } from '@/utils/dailyPlanStatus'
import { getDirectionMonthlyProgress } from '@/views/direction/utils/progress'

const props = defineProps({
  show: Boolean,
  isLoading: Boolean
})

const emit = defineEmits(['update:show'])

const { categorizedGoals } = useDirectionFetch()
const { selectedGoal, selectGoal, selectedMonth, datesWithTasks, dailyTasks, dayTaskKey } = useDirectionSelection()
const { handleEditGoal } = useDirectionGoals()
const { handleUpdateTask } = useDirectionTasks()
const { months } = useDirectionGoals()

const tabs = [
  { id: 'goals', label: '目标' },
  { id: 'archive', label: '归档' }
]

const activeTab = ref('goals')

const selectedGoalName = computed(() => selectedGoal.value?.name || '')

const systemLoad = computed(() => {
  if (!selectedGoal.value || !selectedMonth.value) return 0

  const planId = selectedGoal.value.plan_id
  const month = selectedMonth.value

  const monthPlan = getMonthlyPlansByPlanId(planId).find(
    mp => getDateOnlyMonth(mp.month) === month
  )

  if (!monthPlan) return 0

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
