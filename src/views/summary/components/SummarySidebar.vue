<template>
  <aside 
    class="group w-full md:w-auto border-zinc-100 border-b md:border-b-0 md:border-r flex flex-col z-20 bg-background relative overflow-hidden"
    :style="isMobile ? { width: '100%' } : { width: width + 'px' }"
  >
    <!-- Resize Handle -->
    <div 
      v-if="!isMobile"
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0 hover:bg-foreground/10 group-hover:opacity-100"
      :class="{ 'bg-foreground/20 opacity-100': isResizing }"
      @mousedown="startResize"
    ></div>

    <!-- Header -->
    <header class="px-6 pt-6 md:pt-10 pb-4 shrink-0 border-b border-border mb-4">
      <div class="flex flex-col gap-2 mb-6">
        <h2 class="text-2xl font-semibold tracking-tight">总结回顾</h2>
        <p class="text-xs text-muted-foreground">在这里回顾您的过去与规划未来</p>
      </div>
      
      <!-- Tabs -->
      <div class="flex gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="emit('update:activeTab', tab.id)"
          class="text-xs font-medium transition-all relative pb-2"
          :class="activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        >
          {{ tab.label }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
        </button>
      </div>
    </header>

    <!-- List -->
    <ScrollArea class="flex-1 px-4 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-2 pb-24 pt-2">
        <div v-if="summaries.length === 0" class="text-muted-foreground text-xs py-8 text-center bg-zinc-50/50 rounded-lg border border-dashed">
          暂无总结记录
        </div>

        <button 
          v-for="summary in summaries" 
          :key="summary.id" 
          @click="emit('select', summary)"
          class="flex flex-col items-start gap-1 p-3 rounded-lg transition-all text-left"
          :class="selectedSummaryId === summary.id ? 'bg-secondary ring-1 ring-border' : 'hover:bg-zinc-50'"
        >
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {{ formatDate(summary) }}
          </span>
          <h4
            class="text-sm font-semibold tracking-tight line-clamp-1"
            :class="selectedSummaryId === summary.id ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ getSummaryTitle(summary) }}
          </h4>
        </button>
      </div>
    </ScrollArea>

    <!-- Floating Create Button -->
    <div class="absolute bottom-6 right-6 z-30">
      <Button 
        size="icon"
        @click="emit('create')"
        class="w-12 h-12 rounded-full shadow-xl transition-all bg-foreground text-background hover:scale-105 active:scale-95"
      >
        <Plus class="w-6 h-6" />
      </Button>
    </div>
  </aside>
</template>

/**
 * SummarySidebar.vue - 总结回顾侧边栏组件
 * 
 * 功能说明：
 * - 作为总结模块的侧边导航，提供「日/周/月/年」四种总结类型的快速切换
 * - 展示总结列表，支持选中态和创建新总结
 * - 可通过拖拽调整宽度（桌面端），移动端自动全宽
 * 
 * 外部交互：
 * - 监听 activeTab 变化，通过 emit('update:activeTab') 同步父组件
 * - 点击总结项时 emit('select', summary) 通知父组件展示详情
 * - 点击浮动按钮时 emit('create') 触发新建总结流程
 * 
 * 依赖的 Composables：
 * - useSummarySidebar: 提供 tabs 配置、日期格式化、标题提取等业务逻辑
 * - useResizable: 提供侧边栏宽度调整能力（桌面端）
 * - useMobile: 判断当前是否为移动端视图
 */
<script setup>
import { useSummarySidebar } from '@/views/summary/composables/useSummarySidebar'
import { useResizable } from '@/composables/useResizable'
import { useMobile } from '@/composables/useMobile'
import { Plus } from 'lucide-vue-next'
import { toRef } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

// Props：父组件传入当前激活的 Tab、总结列表、当前选中项 ID
const props = defineProps({
  activeTab: String,           // 当前激活的 tab id（如 'day' | 'week' | 'month' | 'year'）
  summaries: Array,             // 总结记录列表，每项包含 id、日期、标题等字段
  selectedSummaryId: String    // 当前选中的总结 ID，用于高亮展示
})

// Emits：组件内部状态变化时通知父组件
const emit = defineEmits(['update:activeTab', 'select', 'create'])

// useResizable：侧边栏宽度拖拽调整（仅桌面端生效）
const { width, startResize, isResizing } = useResizable()

// useMobile：判断是否为移动端，移动端侧边栏强制全宽
const { isMobile } = useMobile()

// useSummarySidebar：业务逻辑层，提供 Tab 配置、日期格式化、标题提取
const { tabs, formatDate, getSummaryTitle } = useSummarySidebar(toRef(props, 'activeTab'))
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
