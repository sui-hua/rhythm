<!--
  ============================================
  Summary 视图 - 总结模块主页面 (views/summary/index.vue)
  ============================================

  【模块职责】
  - 日/周/月/年总结管理
  - 支持创建、编辑、删除总结
  - 左侧列表 + 右侧表单布局

  【布局结构】
  - SummarySidebar → 左侧总结列表（按日/周/月/年分类）
  - DailySummaryForm → 日总结表单
  - GenericSummaryForm → 周/月/年总结表单（通用）

  【视图状态】
  - currentView === 'empty' → 空状态提示
  - currentView === 'form' → 新增/编辑表单
  - currentView === 'detail-or-edit' → 查看或编辑
-->
<template>
  <div class="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- Sidebar -->
    <SummarySidebar
      :active-tab="activeTab"
      :summaries="summaries"
      :selected-summary-id="selectedSummary?.id"
      @update:activeTab="handleTabChange"
      @select="handleSelect"
      @create="handleCreate"
    />

    <!-- Main Content -->
    <main class="flex-1 h-full relative overflow-hidden bg-zinc-50/50 flex flex-col items-center justify-center p-4 md:p-10">
      <div v-if="loading" class="flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>

      <div v-else-if="currentView === 'empty'" class="flex flex-col items-center gap-4 text-center max-w-sm">
        <div class="w-12 h-12 rounded-full bg-card border flex items-center justify-center text-muted-foreground">
          <ChevronRight class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold tracking-tight">{{ narrative.emptyTitle }}</h3>
          <p class="text-sm text-muted-foreground">{{ narrative.emptyDescription }}</p>
        </div>
      </div>

      <div v-else class="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">
        <Card class="border-none shadow-xl bg-background rounded-xl overflow-hidden">
          <CardHeader class="pb-6">
            <CardTitle class="text-2xl font-semibold tracking-tight">
              {{ isCreating ? '新增总结' : '编辑总结' }}
            </CardTitle>
            <CardDescription class="text-muted-foreground">
              {{ isCreating ? '填写您的反思与感悟，沉淀价值。' : '更新您的回顾内容，完善记录。' }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Daily Form -->
            <DailySummaryForm 
              v-if="activeTab === 'day'" 
              :initial-data="selectedSummary"
              @save="handleSave"
              @cancel="handleCancel"
              @delete="selectedSummary?.id && handleDelete(selectedSummary.id)"
            />

            <!-- Generic Form -->
            <GenericSummaryForm 
              v-else 
              :type="activeTab"
              :initial-data="selectedSummary"
              @save="handleSave"
              @cancel="handleCancel"
              @delete="selectedSummary?.id && handleDelete(selectedSummary.id)"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useSummaryManager } from '@/views/summary/composables/useSummaryManager'
import { ChevronRight } from 'lucide-vue-next'
import SummarySidebar from '@/views/summary/components/SummarySidebar.vue'
import DailySummaryForm from '@/views/summary/components/DailySummaryForm.vue'
import GenericSummaryForm from '@/views/summary/components/GenericSummaryForm.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import PageIntroBanner from '@/components/PageIntroBanner.vue'
import { getPageNarrative } from '@/config/pageNarratives'

const narrative = getPageNarrative('summary')

const {
  activeTab,
  summaries,
  loading,
  selectedSummary,
  isCreating,
  currentView,
  handleTabChange,
  handleSelect,
  handleCreate,
  handleSave,
  handleCancel,
  handleDelete
} = useSummaryManager()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
