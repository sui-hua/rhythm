<template>
  <!--
    Sidebar — 日页面右侧侧边栏，展示当日任务列表与进度统计
    主要结构：加载骨架屏、日期标题、可滚动任务列表（普通任务 + 遗留任务分组）、底部进度条与添加按钮
  -->
  <aside
    class="border-r border-border flex flex-col h-full overflow-hidden group relative z-20 bg-background"
    :style="{ width: width + 'px' }"
  >
    <!-- 加载骨架屏：数据加载中时覆盖整个侧边栏 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm px-4 pt-24"
    >
      <div class="flex flex-col gap-4">
        <SkeletonTask v-for="i in 5" :key="i" />
      </div>
    </div>

    <!-- 侧边栏宽度拖拽调整手柄：hover 时显示，拖拽改变侧边栏宽度 -->
    <div
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0 group-hover:opacity-100 hover:bg-primary/10"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize">
    </div>

    <!-- 日期标题区：显示选中日期的天数和月份名称 -->
    <header class="px-6 pt-12 pb-8 shrink-0 mb-2 bg-transparent">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <h2 class="text-4xl font-black tracking-tighter italic uppercase transition-all duration-700 ease-expo">{{ selectedDay }}</h2>
        </div>
        <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{{ selectedMonthName }} / TASKS</p>
      </div>
    </header>

    <!-- 任务列表区开始：可滚动区域，包含普通任务和遗留任务分组 -->
    <ScrollArea class="flex-1 px-4 relative z-10">
      <!-- 有任务时渲染任务列表 -->
      <div v-if="dayStore.dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">
        <template v-for="(section, sectionIndex) in sidebarSections" :key="`desktop-${sectionIndex}`">
          <div
            v-if="section.type === 'item'"
            @click="section.item.type === 'summary' ? $emit('open-summary') : $emit('scrollToTask', section.item.id)"
            @dblclick="section.item.type !== 'summary' && $emit('edit-task', section.item.id)"
            class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group"
            :class="section.item.completed ? 'opacity-50' : 'hover:bg-zinc-50'"
          >
            <div @click.stop @dblclick.stop>
              <Checkbox
                :model-value="section.item.completed"
                @update:model-value="() => dayStore.handleToggleComplete(section.item)"
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
                  v-if="section.item.type !== 'summary'"
                  class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                  @click.stop="$emit('edit-task', section.item.id)"
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
              @click="toggleCarryOverGroup(sectionIndex)"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{{ section.label }}</span>
                <span class="text-sm font-semibold text-foreground">{{ section.count }} 个未完成目标</span>
              </div>
              <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform" :class="expandedGroups[sectionIndex] ? 'rotate-180' : ''" />
            </button>

            <div v-if="expandedGroups[sectionIndex]" class="flex flex-col gap-1 border-l border-border/50 pl-3">
              <div
                v-for="item in section.items"
                :key="`desktop-carry-${item.id}`"
                @click="$emit('scrollToTask', item.id)"
                @dblclick="$emit('edit-task', item.id)"
                class="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group"
                :class="item.completed ? 'opacity-50' : 'hover:bg-background/90'"
              >
                <div @click.stop @dblclick.stop>
                  <Checkbox
                    :model-value="item.completed"
                    @update:model-value="() => dayStore.handleToggleComplete(item)"
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
                      @click.stop="$emit('edit-task', item.id)"
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
      <!-- 无任务时显示空状态提示 -->
      <div v-else-if="!isLoading" class="pb-24 pt-4">
        <EmptyState
          title="今日暂无任务"
          description="日程已清空，深呼吸放松一下，或者计划点新事情。"
        >
          <template #action>
            <Button variant="outline" size="sm" class="rounded-full px-6 active:scale-[0.97]" @click="$emit('add-event')">
              添加第一个任务
            </Button>
          </template>
        </EmptyState>
      </div>
    </ScrollArea>
    <!-- 任务列表区结束 -->

    <!-- 底部统计区：任务完成度进度条 + 添加项目按钮 -->
    <footer class="p-6 border-t border-border/10 bg-transparent relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">任务完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ Math.round((dayStore.dailySchedule.length ? (dayStore.completedCount/dayStore.dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dayStore.dailySchedule.length ? (dayStore.completedCount/dayStore.dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
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

<script lang="ts" setup>
/**
 * Sidebar — 日页面右侧侧边栏组件
 * 数据流：dayStore.dailySchedule → indexedDailySchedule（带索引）→ sidebarSections（分组）→ 模板渲染
 * 负责展示当日任务列表、遗留任务分组、完成度统计，并提供任务操作入口
 */

// ── 依赖导入 ──
import { computed, ref } from 'vue'
import { ChevronDown, Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import SkeletonTask from '@/components/ui/SkeletonTask.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useResizable } from '@/composables/useResizable'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { useDayStore } from '@/stores/dayStore'
import { buildSidebarSections } from '@/views/day/utils/sidebarSections'

// ── Props ──
// isLoading: 数据加载状态，控制骨架屏显隐
defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})

// ── Store ──
// 日期状态管理，获取当前选中的日期
const dateStore = useDateStore()
// 当日任务数据和操作方法：dailySchedule（任务列表）、completedCount（已完成数）、handleToggleComplete（切换完成状态）
const dayStore = useDayStore()

// ── 计算属性 ──
// 为每项日程附加原始索引，供 scrollToTask 定位使用
const indexedDailySchedule = computed(() => dayStore.dailySchedule.map((item, index) => ({ ...item, _originalIndex: index })))
// 将日程列表分为普通任务项和遗留任务分组，供模板按 section 类型分别渲染
const sidebarSections = computed(() => buildSidebarSections(indexedDailySchedule.value))

// ── 状态 ──
// 各延后项分组的展开状态，按 sectionIndex 独立控制
const expandedGroups = ref<Record<number, boolean>>({})

// ── Composables ──
// 侧边栏宽度可拖拽调整：width（当前宽度）、startResize（启动拖拽）、isResizing（拖拽中状态）
const { width, startResize, isResizing } = useResizable()

// ── 计算属性 ──
// 选中日期的天数（1-31），用于标题区大字显示
const selectedDay = computed(() => dateStore.currentDate.getDate())
// 选中日期的完整月份名称（如 "January"），用于标题区副标题
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

// ── 方法 ──
// 切换指定延后项分组的展开/收起状态
const toggleCarryOverGroup = (index: number) => {
  expandedGroups.value[index] = !expandedGroups.value[index]
}

// ── Emits ──
// scrollToTask: 滚动到指定任务 | add-event: 添加新任务 | edit-task: 编辑任务 | open-summary: 打开总结弹框
defineEmits(['scrollToTask', 'add-event', 'edit-task', 'open-summary'])
</script>

<style scoped>
</style>
