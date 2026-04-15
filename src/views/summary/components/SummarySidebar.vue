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
            {{ formatDate(summary.date, activeTab) }}
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

<script setup>
/**
 * Summary 侧边栏组件
 * 支持 Tab 切换、总结列表展示、新增按钮，宽度可拖拽调整
 */
import { useSummarySidebar } from '@/views/summary/composables/useSummarySidebar'
import { useResizable } from '@/composables/useResizable'
import { useMobile } from '@/composables/useMobile'
import { Plus } from 'lucide-vue-next'
import { toRef } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps({
  activeTab: String,
  summaries: Array,
  selectedSummaryId: String
})

const emit = defineEmits(['update:activeTab', 'select', 'create'])

const { width, startResize, isResizing } = useResizable()
const { isMobile } = useMobile()
const { tabs, formatDate, getSummaryTitle } = useSummarySidebar(toRef(props, 'activeTab'))
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
