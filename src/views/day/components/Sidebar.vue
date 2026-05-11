<template>
  <aside 
    :class="getSidebarPanelClass({ isMobile, show })"
    :style="{ width: isMobile ? '100%' : width + 'px' }"
  >
    <div
      v-if="isLoading"
      class="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm px-4 pt-24"
    >
      <div class="flex flex-col gap-4">
        <SkeletonTask v-for="i in 5" :key="i" />
      </div>
    </div>
    <!-- 侧边栏宽度拖拽调整手柄 (仅桌面端) -->
    <div 
      v-if="!isMobile"
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0 group-hover:opacity-100 hover:bg-primary/10"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize">
    </div>

    <header class="px-6 pt-12 pb-8 shrink-0 mb-2 bg-transparent">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <h2 class="text-4xl font-black tracking-tighter italic uppercase transition-all duration-700 ease-expo">{{ selectedDay }}</h2>
          <Button
            v-if="isMobile"
            variant="ghost"
            size="icon"
            class="-mr-2 h-8 w-8 active:scale-[0.97]"
            @click="$emit('close')"
            aria-label="关闭侧边栏"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{{ selectedMonthName }} / TASKS</p>
      </div>
    </header>

    <!-- 侧边栏任务列表，可滚动 -->
    <ScrollArea class="flex-1 px-4 relative z-10">
      <!-- 移动端：支持左滑完成任务 -->
      <div v-if="isMobile && dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">
        <template v-for="(section, sectionIndex) in sidebarSections" :key="`mobile-${sectionIndex}`">
          <button
            v-if="section.type === 'carry-over-group'"
            type="button"
            class="mx-1 flex items-center justify-between rounded-xl border border-border/50 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:bg-zinc-100/80"
            @click="toggleCarryOverGroup"
          >
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">延后项</span>
              <span class="text-sm font-semibold text-foreground">{{ section.count }} 个未完成目标</span>
            </div>
            <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform" :class="isCarryOverExpanded ? 'rotate-180' : ''" />
          </button>

          <template v-if="section.type === 'item'">
            <div
              @click="$emit('scrollToTask', section.item._originalIndex)"
              @dblclick="$emit('edit-task', section.item._originalIndex)"
              @touchstart="handleTouchStart($event, section.item._originalIndex)"
              @touchmove="handleTouchMove($event, section.item._originalIndex)"
              @touchend="handleTouchEnd($event, section.item._originalIndex, section.item)"
              class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
              :class="section.item.completed ? 'opacity-50' : 'hover:bg-zinc-50'"
              :style="{ transform: `translateX(-${getSwipeOffset(section.item._originalIndex)}px)`, transition: swipeState.activeIndex === section.item._originalIndex ? 'none' : 'transform 0.3s ease' }"
            >
              <div
                v-if="getSwipeOffset(section.item._originalIndex) > 0"
                class="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-end pr-4"
                :style="{ width: `${getSwipeOffset(section.item._originalIndex)}px` }"
              >
                <Check class="w-5 h-5 text-white" />
              </div>

              <div @click.stop @dblclick.stop>
                <Checkbox
                  :checked="section.item.completed"
                  @update:checked="handleToggleComplete(section.item)"
                  class="shrink-0 w-5 h-5 rounded-md"
                />
              </div>

              <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                <div class="flex items-center justify-between gap-2 w-full">
                  <h4 class="text-sm font-semibold tracking-tight truncate transition-all"
                    :class="section.item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground group-hover:text-foreground'"
                  >
                    {{ section.item.title }}
                  </h4>
                  <button
                    class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                    @click.stop="$emit('edit-task', section.item._originalIndex)"
                    aria-label="编辑任务"
                  >
                    <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </template>

          <div
            v-else-if="section.type === 'carry-over-group' && isCarryOverExpanded"
            class="ml-3 flex flex-col gap-2 border-l border-border/50 pl-3"
          >
            <div
              v-for="item in section.items"
              :key="`mobile-carry-${item._originalIndex}`"
              @click="$emit('scrollToTask', item._originalIndex)"
              @dblclick="$emit('edit-task', item._originalIndex)"
              @touchstart="handleTouchStart($event, item._originalIndex)"
              @touchmove="handleTouchMove($event, item._originalIndex)"
              @touchend="handleTouchEnd($event, item._originalIndex, item)"
              class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
              :class="item.completed ? 'opacity-50' : 'hover:bg-zinc-50/80'"
              :style="{ transform: `translateX(-${getSwipeOffset(item._originalIndex)}px)`, transition: swipeState.activeIndex === item._originalIndex ? 'none' : 'transform 0.3s ease' }"
            >
              <div
                v-if="getSwipeOffset(item._originalIndex) > 0"
                class="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-end pr-4"
                :style="{ width: `${getSwipeOffset(item._originalIndex)}px` }"
              >
                <Check class="w-5 h-5 text-white" />
              </div>

              <div @click.stop @dblclick.stop>
                <Checkbox
                  :checked="item.completed"
                  @update:checked="handleToggleComplete(item)"
                  class="shrink-0 w-5 h-5 rounded-md"
                />
              </div>

              <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                <div class="flex items-center justify-between gap-2 w-full">
                  <h4 class="text-sm font-semibold tracking-tight truncate transition-all"
                    :class="item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground group-hover:text-foreground'"
                  >
                    {{ item.title }}
                  </h4>
                  <button
                    class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                    @click.stop="$emit('edit-task', item._originalIndex)"
                    aria-label="编辑任务"
                  >
                    <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <p class="text-[11px] font-medium text-amber-600/85 dark:text-amber-400/85 truncate">
                  {{ item.carryOverLabel }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 桌面端：普通列表 -->
      <div v-else-if="!isMobile && dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">
        <template v-for="(section, sectionIndex) in sidebarSections" :key="`desktop-${sectionIndex}`">
          <div
            v-if="section.type === 'item'"
            @click="$emit('scrollToTask', section.item._originalIndex)"
            @dblclick="$emit('edit-task', section.item._originalIndex)"
            class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group"
            :class="section.item.completed ? 'opacity-50' : 'hover:bg-zinc-50'"
          >
            <div @click.stop @dblclick.stop>
              <Checkbox
                :checked="section.item.completed"
                @update:checked="handleToggleComplete(section.item)"
                class="shrink-0 w-5 h-5 rounded-md"
              />
            </div>

            <div class="flex-1 min-w-0 flex flex-col gap-0.5">
              <div class="flex items-center justify-between gap-2 w-full">
                <h4 class="text-sm font-semibold tracking-tight truncate transition-all"
                  :class="section.item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground group-hover:text-foreground'"
                >
                  {{ section.item.title }}
                </h4>
                <button
                  class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                  @click.stop="$emit('edit-task', section.item._originalIndex)"
                  aria-label="编辑任务"
                >
                  <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="mx-1 flex flex-col gap-2 rounded-xl border border-border/50 bg-zinc-50/70 p-2">
            <button
              type="button"
              class="flex items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-100/80"
              @click="toggleCarryOverGroup"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{{ section.label }}</span>
                <span class="text-sm font-semibold text-foreground">{{ section.count }} 个未完成目标</span>
              </div>
              <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform" :class="isCarryOverExpanded ? 'rotate-180' : ''" />
            </button>

            <div v-if="isCarryOverExpanded" class="flex flex-col gap-1 border-l border-border/50 pl-3">
              <div
                v-for="item in section.items"
                :key="`desktop-carry-${item._originalIndex}`"
                @click="$emit('scrollToTask', item._originalIndex)"
                @dblclick="$emit('edit-task', item._originalIndex)"
                class="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group"
                :class="item.completed ? 'opacity-50' : 'hover:bg-white/90'"
              >
                <div @click.stop @dblclick.stop>
                  <Checkbox
                    :checked="item.completed"
                    @update:checked="handleToggleComplete(item)"
                    class="shrink-0 w-5 h-5 rounded-md"
                  />
                </div>

                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center justify-between gap-2 w-full">
                    <h4 class="text-sm font-semibold tracking-tight truncate transition-all"
                      :class="item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground group-hover:text-foreground'"
                    >
                      {{ item.title }}
                    </h4>
                    <button
                      class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                      @click.stop="$emit('edit-task', item._originalIndex)"
                      aria-label="编辑任务"
                    >
                      <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p class="text-[11px] font-medium text-amber-600/85 dark:text-amber-400/85 truncate">
                    {{ item.carryOverLabel }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div v-else-if="!isLoading" class="pb-24 pt-4">
        <EmptyState
          title="No Tasks Today"
          description="Your schedule is clear. Take a deep breath or plan something new."
        >
          <template #action>
            <Button variant="outline" size="sm" class="rounded-full px-6 active:scale-[0.97]" @click="$emit('add-event')">
              Create First Task
            </Button>
          </template>
        </EmptyState>
      </div>
    </ScrollArea>

    <!-- 侧边栏底部统计和添加按钮 -->
    <footer class="p-6 border-t border-border/10 bg-transparent relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">任务完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ Math.round((dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
      </div>
      <Button
        class="w-full gap-2 h-9 text-xs font-semibold active:scale-[0.97]"
        @click="$emit('add-event')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>

<script setup>
/**
 * Sidebar.vue - 日视图侧边栏组件
 * 
 * 功能说明：
 * - 显示选中日期的任务列表（dailySchedule）
 * - 支持移动端左滑快速完成任务的交互
 * - 支持桌面端拖拽调整侧边栏宽度
 * - 显示任务完成度进度条
 * - 提供添加、编辑任务的操作入口
 * 
 * 响应式设计：
 * - 移动端：全屏显示，支持左滑手势完成任务的触控交互
 * - 桌面端：固定宽度显示，支持拖拽调整宽度
 * 
 * 状态管理：
 * - 通过 useDayData composable 获取任务数据和完成状态
 * - 通过 useResizable composable 管理宽度拖拽
 * - 通过 dateStore 获取当前选中日期
 * 
 * @component
 * @example
 * // &lt;Sidebar :is-mobile="isMobile" :show="showSidebar" :is-loading="isLoading"
 * //   @scroll-to-task="handleScroll" @add-event="openAddDialog"
 * //   @edit-task="openEditDialog" @close="closeSidebar" /&gt;
 */
import { computed, ref } from 'vue'
import { ChevronDown, Plus, Settings2, X, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import SkeletonTask from '@/components/ui/SkeletonTask.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useResizable } from '@/composables/useResizable'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { useDayData } from '@/views/day/composables/useDayData'
import { getSidebarPanelClass } from '@/views/day/composables/mobileLayers'
import { buildSidebarSections } from '@/views/day/composables/sidebarSections'
import { playSuccessSound } from '@/utils/audio'

/**
 * 组件 Props 定义
 * @property {boolean} isMobile - 是否为移动端模式
 * @property {boolean} show - 侧边栏是否显示（用于移动端控制显隐）
 * @property {boolean} isLoading - 是否正在加载数据（显示骨架屏）
 */
const props = defineProps({
  isMobile: Boolean,
  show: Boolean,
  isLoading: {
    type: Boolean,
    default: false
  }
})

// ==================== 状态初始化 ====================

// 日期状态管理，获取当前选中的日期
const dateStore = useDateStore()

// 从 useDayData 获取当日任务相关数据和方法
// dailySchedule: 当日任务列表
// completedCount: 已完成任务数量
// handleToggleComplete: 切换任务完成状态的方法
const { dailySchedule, completedCount, handleToggleComplete } = useDayData()
const indexedDailySchedule = computed(() => dailySchedule.value.map((item, index) => ({ ...item, _originalIndex: index })))
const sidebarSections = computed(() => buildSidebarSections(indexedDailySchedule.value))
const isCarryOverExpanded = ref(false)

// 宽度可调整功能（仅桌面端）
// width: 当前侧边栏宽度
// startResize: 开始拖拽调整宽度
// isResizing: 是否正在调整宽度的状态
const { width, startResize, isResizing } = useResizable()

// ==================== 计算属性 ====================

// 获取选中日期的天数（1-31）
const selectedDay = computed(() => dateStore.currentDate.getDate())

// 获取选中日期的完整月份名称（如 "January"）
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

const toggleCarryOverGroup = () => {
  isCarryOverExpanded.value = !isCarryOverExpanded.value
}

// ==================== 移动端左滑完成功能 ====================
// 左滑完成功能的常量配置
const SWIPE_THRESHOLD = 0.5  // 完成手势的阈值比例（向左滑动超过 50% 则触发完成）
const MAX_SWIPE = 80         // 最大左滑距离（像素），超过此距离不再增加

/**
 * 左滑操作的状态管理
 * @property {number} activeIndex - 当前正在左滑的任务索引，-1 表示无操作
 * @property {number} startX - 触摸起始点的 X 坐标
 * @property {number} currentX - 触摸当前点的 X 坐标
 */
const swipeState = ref({
  activeIndex: -1,
  startX: 0,
  currentX: 0
})

/**
 * 计算指定任务的左滑偏移量
 * @param {number} index - 任务索引
 * @returns {number} 当前的左滑偏移像素值
 */
const getSwipeOffset = (index) => {
  if (swipeState.value.activeIndex !== index) return 0
  // delta > 0 表示向左滑（startX > currentX）
  const delta = swipeState.value.startX - swipeState.value.currentX
  // 限制在 0 到 MAX_SWIPE 之间
  return Math.max(0, Math.min(delta, MAX_SWIPE))
}

/**
 * 触摸开始事件处理 - 记录起始位置
 * @param {TouchEvent} e - 触摸事件对象
 * @param {number} index - 触发触摸的任务索引
 */
const handleTouchStart = (e, index) => {
  swipeState.value.activeIndex = index
  swipeState.value.startX = e.touches[0].clientX
  swipeState.value.currentX = e.touches[0].clientX
}

/**
 * 触摸移动事件处理 - 更新当前位置
 * @param {TouchEvent} e - 触摸事件对象
 * @param {number} index - 触发触摸的任务索引
 */
const handleTouchMove = (e, index) => {
  if (swipeState.value.activeIndex !== index) return
  swipeState.value.currentX = e.touches[0].clientX
}

/**
 * 触摸结束事件处理 - 判断是否触发完成操作
 * @param {TouchEvent} e - 触摸事件对象
 * @param {number} index - 触发触摸的任务索引
 * @param {Object} item - 任务数据对象
 */
const handleTouchEnd = async (e, index, item) => {
  if (swipeState.value.activeIndex !== index) return

  // 计算滑动比例：delta 为正表示向左滑
  const delta = swipeState.value.startX - swipeState.value.currentX
  const ratio = delta / 280  // 280 为参考滑动距离基准值

  // 重置左滑状态
  swipeState.value.activeIndex = -1

  // 当滑动比例达到阈值时，标记任务为完成
  if (ratio >= SWIPE_THRESHOLD) {
    // 触发设备震动反馈（如果设备支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    // 播放成功音效
    playSuccessSound()
    // 调用任务完成处理函数
    await handleToggleComplete(item)
  }
}

// ==================== 事件定义 ====================
// 向父组件暴露的事件
defineEmits(['scrollToTask', 'add-event', 'edit-task', 'close'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
