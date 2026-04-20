<!--
  ============================================
  Habits 移动端习惯列表抽屉 (HabitMobileListSheet.vue)
  ============================================

  【模块职责】
  - 移动端底部抽屉
  - 包含：习惯列表（HabitSidebar 内容精简版）
  - 支持触摸手势滑动打开/关闭

  【抽屉结构】
  - 顶部拉手区域
  - Tab 切换：进行中 / 已归档
  - 习惯列表
  - 今日完成率
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
        <!-- Tab 切换：进行中 / 已归档 -->
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

        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex-1 overflow-y-auto">
          <div class="skeleton-item h-14 rounded-lg mb-2" />
          <div class="skeleton-item h-14 rounded-lg mb-2" />
          <div class="skeleton-item h-14 rounded-lg" />
        </div>

        <!-- 滚动内容区 -->
        <div v-else class="flex-1 overflow-y-auto">
          <!-- 进行中 Tab -->
          <div v-if="activeTab === 'active'" class="habit-list">
            <button
              v-for="habit in habits"
              :key="habit.id"
              class="habit-button"
              :class="{ 'is-active': selectedHabitId === habit.id }"
              @click="$emit('select-habit', habit)"
            >
              <div class="habit-row">
                <div class="habit-color" :style="{ backgroundColor: habit.color || '#6366f1' }"></div>
                <div class="habit-info">
                  <h4 class="habit-title">{{ habit.title }}</h4>
                  <p class="habit-streak">连续 {{ habit.currentStreak || 0 }} 天</p>
                </div>
                <div class="habit-check" :class="{ 'is-completed': isTodayCompleted(habit) }">
                  <Check v-if="isTodayCompleted(habit)" class="w-4 h-4" />
                </div>
              </div>
            </button>

            <div v-if="habits.length === 0" class="empty-list">
              <p class="empty-list-text">暂无进行中的习惯</p>
            </div>
          </div>

          <!-- 已归档 Tab -->
          <div v-else-if="activeTab === 'archived'" class="habit-list">
            <button
              v-for="habit in archivedHabits"
              :key="habit.id"
              class="habit-button"
              :class="{ 'is-active': selectedHabitId === habit.id }"
              @click="$emit('select-habit', habit)"
            >
              <div class="habit-row">
                <div class="habit-color" :style="{ backgroundColor: habit.color || '#6366f1', opacity: 0.5 }"></div>
                <div class="habit-info">
                  <h4 class="habit-title text-muted-foreground">{{ habit.title }}</h4>
                  <p class="habit-streak">已归档</p>
                </div>
              </div>
            </button>

            <div v-if="archivedHabits.length === 0" class="empty-list">
              <p class="empty-list-text">暂无归档的习惯</p>
            </div>
          </div>
        </div>

        <!-- 底部统计 -->
        <div class="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <div class="footer-metric">
            <span class="footer-label">今日完成率</span>
            <span class="footer-value">{{ todayCompletionRate }}%</span>
          </div>
          <Progress :model-value="todayCompletionRate" class="progress-bar" />

          <!-- 添加习惯按钮 -->
          <Button
            class="w-full mt-4"
            variant="outline"
            @click="$emit('add-habit')"
          >
            <Plus class="w-4 h-4 mr-2" />
            添加新习惯
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

/**
 * HabitMobileListSheet.vue - 移动端习惯列表抽屉组件
 * =========================================================
 *
 * 【组件定位】
 * 移动端专用组件，作为 HabitSidebar（桌面端侧边栏）的替代方案。
 * 采用底部抽屉（Bottom Sheet）交互模式，适配移动设备的小屏幕特点。
 *
 * 【核心功能】
 * 1. 底部抽屉式交互 - 支持点击遮罩层或顶部拉手关闭抽屉
 * 2. Tab 切换 - 区分"进行中"和"已归档"两类习惯
 * 3. 习惯列表展示 - 显示习惯名称、颜色标识、连续打卡天数、今日完成状态
 * 4. 今日完成率统计 - 底部显示当日所有习惯的完成进度
 * 5. 添加习惯入口 - 快速添加新习惯的操作按钮
 *
 * 【数据流向】
 * - Props 接收: habits(进行中列表), archivedHabits(归档列表), selectedHabitId, todayCompletionRate, isLoading
 * - Events 触发: update:show(控制显隐), select-habit(选择习惯), add-habit(添加习惯)
 *
 * 【样式特点】
 * - 使用 Tailwind CSS 4 原子化样式
 * - 圆角 2.5rem 营造 iOS 风格底部抽屉感
 * - 暗色模式适配 (dark:bg-zinc-900)
 * - 骨架屏加载状态提供流畅体验
 *
 * 【抽屉动画】
 * - translate-y 控制显隐: show=true 时 translate-y-0, show=false 时 translate-y-full
 * - 动画时长 700ms, 使用 ease-expo 缓动函数提供流畅手感
 *
 * @see HabitSidebar - 桌面端对应组件，功能相似但布局不同
 * @see useHabitList - 习惯列表相关 composable
 */

<script setup>
import { ref, computed } from 'vue'
import { Check, Plus } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

// ============ Props 定义 ============
// show: 控制抽屉显隐，v-model 双向绑定
// habits: 进行中的习惯列表，每项包含 id, title, color, currentStreak, completedDays
// archivedHabits: 已归档的习惯列表，样式上降低透明度（opacity: 0.5）
// selectedHabitId: 当前选中的习惯 ID，用于高亮显示
// todayCompletionRate: 今日完成率百分比（0-100）
// isLoading: 加载状态，为 true 时显示骨架屏

const props = defineProps({
  show: Boolean,
  habits: {
    type: Array,
    default: () => []
  },
  archivedHabits: {
    type: Array,
    default: () => []
  },
  selectedHabitId: {
    type: [String, Number],
    default: null
  },
  todayCompletionRate: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'select-habit', 'edit-habit', 'add-habit'])

// ============ 组件状态 ============
// tabs: Tab 配置数组，定义进行中/已归档两个切换项
// activeTab: 当前激活的 Tab ID，默认 'active'

const tabs = [
  { id: 'active', label: '进行中' },
  { id: 'archived', label: '已归档' }
]

const activeTab = ref('active')

/**
 * 检查习惯今天是否已完成
 */
const isTodayCompleted = (habit) => {
  if (!habit.completedDays || !Array.isArray(habit.completedDays)) return false
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return habit.completedDays.includes(todayStr)
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.habit-list {
  @apply flex flex-col gap-2;
}

.habit-button {
  @apply flex flex-col items-start p-3 rounded-lg transition-all text-left w-full;
}

.habit-button.is-active {
  @apply bg-secondary ring-1 ring-border shadow-sm;
}

.habit-row {
  @apply flex items-center gap-3 w-full;
}

.habit-color {
  @apply w-3 h-3 rounded-full shrink-0;
}

.habit-info {
  @apply flex-1 min-w-0;
}

.habit-title {
  @apply text-sm font-semibold tracking-tight truncate;
}

.habit-streak {
  @apply text-xs text-muted-foreground mt-0.5;
}

.habit-check {
  @apply w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0;
}

.habit-check.is-completed {
  @apply bg-green-500 border-green-500 text-white;
}

.empty-list {
  @apply h-32 flex flex-col items-center justify-center text-center p-6;
}

.empty-list-text {
  @apply text-sm text-muted-foreground;
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

.skeleton-item {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg;
}
</style>
