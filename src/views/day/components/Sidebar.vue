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
        <div v-for="(item, index) in dailySchedule" :key="index"
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             @touchstart="handleTouchStart($event, index)"
             @touchmove="handleTouchMove($event, index)"
             @touchend="handleTouchEnd($event, index, item)"
             class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
             :class="item.completed ? 'opacity-50' : 'hover:bg-zinc-50'"
             :style="{ transform: `translateX(-${getSwipeOffset(index)}px)`, transition: swipeState.activeIndex === index ? 'none' : 'transform 0.3s ease' }">

          <!-- 左滑显示的完成按钮区域 -->
          <div
            v-if="getSwipeOffset(index) > 0"
            class="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-end pr-4"
            :style="{ width: `${getSwipeOffset(index)}px` }"
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
                @click.stop="$emit('edit-task', index)"
                aria-label="编辑任务"
              >
                <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌面端：普通列表 -->
      <div v-else-if="!isMobile && dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">
        <div v-for="(item, index) in dailySchedule" :key="index"
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group"
             :class="item.completed ? 'opacity-50' : 'hover:bg-zinc-50'">

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
                @click.stop="$emit('edit-task', index)"
                aria-label="编辑任务"
              >
                <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
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
import { computed, ref } from 'vue'
import { Plus, Settings2, X, Check } from 'lucide-vue-next'
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
import { playSuccessSound } from '@/utils/audio'

const props = defineProps({
  isMobile: Boolean,
  show: Boolean,
  isLoading: {
    type: Boolean,
    default: false
  }
})

const dateStore = useDateStore()
const { dailySchedule, completedCount, handleToggleComplete } = useDayData()
const { width, startResize, isResizing } = useResizable()

const selectedDay = computed(() => dateStore.currentDate.getDate())
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

// 左滑完成状态管理
const SWIPE_THRESHOLD = 0.5
const MAX_SWIPE = 80

const swipeState = ref({
  activeIndex: -1,
  startX: 0,
  currentX: 0
})

const getSwipeOffset = (index) => {
  if (swipeState.value.activeIndex !== index) return 0
  const delta = swipeState.value.startX - swipeState.value.currentX
  return Math.max(0, Math.min(delta, MAX_SWIPE))
}

const handleTouchStart = (e, index) => {
  swipeState.value.activeIndex = index
  swipeState.value.startX = e.touches[0].clientX
  swipeState.value.currentX = e.touches[0].clientX
}

const handleTouchMove = (e, index) => {
  if (swipeState.value.activeIndex !== index) return
  swipeState.value.currentX = e.touches[0].clientX
}

const handleTouchEnd = async (e, index, item) => {
  if (swipeState.value.activeIndex !== index) return

  const delta = swipeState.value.startX - swipeState.value.currentX
  const ratio = delta / 280

  swipeState.value.activeIndex = -1

  if (ratio >= SWIPE_THRESHOLD) {
    // 震动反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    playSuccessSound()
    await handleToggleComplete(item)
  }
}

defineEmits(['scrollToTask', 'add-event', 'edit-task', 'close'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
