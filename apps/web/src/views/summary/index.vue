<template>
  <!--
    Summary 页面 — 日/周/月/年总结管理入口
    主要结构：左侧边栏（tab 切换 + 总结列表）、右侧主内容区（空状态 / 表单）
  -->
  <div class="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- 侧边栏：tab 切换与总结列表选择 -->
    <SummarySidebar
      :active-tab="activeTab"
      :summaries="summaries"
      :selected-summary-id="selectedSummary?.id != null ? String(selectedSummary.id) : undefined"
      @update:activeTab="handleTabChange"
      @select="handleSelect"
      @create="handleCreate"
    />

    <!-- 主内容区：加载态、空状态引导、表单编辑 -->
    <main class="flex-1 h-full relative overflow-hidden bg-zinc-50/50 flex flex-col items-center justify-center p-4 md:p-10">
      <!-- 加载态：数据请求中显示旋转指示器 -->
      <div v-if="loading" class="flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>

      <!-- 空状态：无总结时引导用户创建 -->
      <div v-else-if="currentView === 'empty'" class="flex flex-col items-center gap-4 text-center max-w-sm">
        <div class="w-12 h-12 rounded-full bg-card border flex items-center justify-center text-muted-foreground">
          <ChevronRight class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold tracking-tight">{{ narrative.emptyTitle }}</h3>
          <p class="text-sm text-muted-foreground">{{ narrative.emptyDescription }}</p>
        </div>
      </div>

      <!-- 编辑区：新建或编辑总结表单 -->
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
            <!-- 日总结专用表单，结构与通用表单不同；新建时使用预填的今日数据 -->
            <DailySummaryForm
              v-if="activeTab === 'day'"
              :initial-data="selectedSummary ?? prefilledSummary ?? undefined"
              @save="handleSave"
              @cancel="handleCancel"
              @delete="selectedSummary?.id && handleDelete(selectedSummary.id)"
            />

            <!-- 通用总结表单（周/月/年），复用同一组件通过 type 区分 -->
            <GenericSummaryForm
              v-else
              :type="activeTab"
              :initial-data="selectedSummary ?? undefined"
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

<script lang="ts" setup>
/**
 * Summary 页面入口
 * 纯展示层，所有逻辑委托给 useSummaryManager composable
 * 数据流：useSummaryManager → activeTab/summaries/currentView → 侧边栏 + 表单组件
 */

// ── 依赖导入 ──
import { useSummaryManager } from '@/views/summary/composables/useSummaryManager'
import { ChevronRight } from 'lucide-vue-next'
import SummarySidebar from '@/views/summary/components/SummarySidebar.vue'
import DailySummaryForm from '@/views/summary/components/DailySummaryForm.vue'
import GenericSummaryForm from '@/views/summary/components/GenericSummaryForm.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getPageNarrative } from '@/content/pageNarratives'

// ── 页面文案 ──
// 空状态的标题和描述文案，按页面维度配置
const narrative = getPageNarrative('summary')

// ── 视图状态 ──
// 从 composable 获取总结模块的全部状态与操作方法
const {
  activeTab,        // 当前选中的 tab（day/week/month/year）
  summaries,        // 当前 tab 下的总结列表
  loading,          // 数据加载中状态
  selectedSummary,  // 当前选中的总结记录
  prefilledSummary, // 新建日总结时的预填数据（今日任务和习惯聚合）
  isCreating,       // 是否处于新建模式
  currentView,      // 计算得出的视图状态：form / detail-or-edit / empty
  handleTabChange,  // 切换 tab 并重新加载数据
  handleSelect,     // 选中一条总结记录
  handleCreate,     // 进入新建模式
  handleSave,       // 保存总结（新建或更新）
  handleCancel,     // 取消编辑，返回空状态
  handleDelete      // 删除总结记录
} = useSummaryManager()
</script>

<style scoped>
</style>
