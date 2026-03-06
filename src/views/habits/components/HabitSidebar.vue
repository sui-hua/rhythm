<template>
  <aside 
    class="border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden group/sidebar"
    :style="{ width: width + 'px' }"
  >
    <!-- Resize Handle -->
    <div 
      class="absolute right-0 top-0 bottom-0 w-1 hover:bg-primary/10 cursor-col-resize z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize"
    ></div>

    <header class="px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-semibold tracking-tight">日常习惯</h2>
      </div>
    </header>

    <ScrollArea class="flex-1 px-2 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-2 pb-24 pt-2 px-2">
        <button 
          v-for="habit in habits" 
          :key="habit.id"
          @click="$emit('select-habit', habit)"
          @dblclick="$emit('edit-habit', habit)"
          class="flex flex-col items-start gap-1 p-3 mx-1 rounded-lg transition-all text-left group"
          :class="selectedHabitId === habit.id ? 'bg-secondary ring-1 ring-border shadow-sm' : 'hover:bg-zinc-50'"
        >
          <div class="flex items-center justify-between w-full">
            <h4 class="text-sm font-semibold tracking-tight transition-colors"
                :class="selectedHabitId === habit.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'"
            >
              {{ habit.title }}
            </h4>
            <div 
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-200/50 rounded flex items-center justify-center shrink-0"
              @click.stop="$emit('edit-habit', habit)"
            >
              <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </button>

        <template v-if="archivedHabits && archivedHabits.length > 0">
          <div class="mt-4 mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            归档项目
          </div>
          <button 
            v-for="habit in archivedHabits" 
            :key="habit.id"
            @click="$emit('select-habit', habit)"
            @dblclick="$emit('edit-habit', habit)"
            class="flex flex-col items-start gap-1 p-3 mx-1 rounded-lg transition-all text-left group opacity-60 hover:opacity-100"
            :class="selectedHabitId === habit.id ? 'bg-secondary ring-1 ring-border shadow-sm' : 'hover:bg-zinc-50'"
          >
          <div class="flex items-center justify-between w-full">
            <h4 class="text-sm tracking-tight transition-colors line-through"
                :class="selectedHabitId === habit.id ? 'text-foreground font-semibold' : 'text-muted-foreground'"
            >
              {{ habit.title }}
            </h4>
            <div 
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-200/50 rounded flex items-center justify-center shrink-0"
              @click.stop="$emit('edit-habit', habit)"
            >
              <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          </button>
        </template>
      </div>
    </ScrollArea>

    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">今日习惯完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ todayCompletionRate }}%</span>
        </div>
        <Progress :model-value="todayCompletionRate" class="h-1 shadow-none" />
      </div>
      <Button 
        class="w-full gap-2 h-9 text-xs font-semibold"
        @click="$emit('add-habit')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>

<script setup>
/**
 * 习惯应用侧边导航栏 (HabitSidebar.vue)
 * 提供所有的习惯列表项入口展示区域，用户可点击切换焦点，以及展示全局本日完成度的大盘状况。
 */
import { Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

defineProps({
  /**
   * 全部可用习惯的对象数组，用以循环渲染左侧的习惯选择卡片。
   */
  habits: {
    type: Array,
    required: true
  },
  /**
   * 已归档的习惯，用于展示下方的归档项目列表。
   */
  archivedHabits: {
    type: Array,
    default: () => []
  },
  /**
   * 用于接收指示当前哪一项才是“被选中的”标识，以在左侧赋予阴影高亮。
   */
  selectedHabitId: {
    type: String,
    default: null
  },
  /**
   * 整体项目当日的打卡覆盖百分比 (0-100的数值)，用于在角落的横幅进度条进行展现。
   */
  todayCompletionRate: {
    type: Number,
    default: 0
  }
})

// 控制侧边栏可拉伸宽度的自定义 Composable
import { useResizable } from '@/composables/useResizable'
const { width, startResize, isResizing } = useResizable()

defineEmits([
  'select-habit', // 单击某一习惯项时触发，请求将该项设为视点选中
  'back',         // 返回动作预留位
  'add-habit',    // 单击底部 "添加项目" 按钮时触发，指示打开新建弹窗
  'edit-habit'    // 双击某一习惯项目标触发侧边快捷改名的编辑功能
])
</script>