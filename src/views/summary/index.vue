<script setup>
import { ref, onMounted, computed } from 'vue'
import SummarySidebar from './components/SummarySidebar.vue'
import DailySummaryForm from './components/DailySummaryForm.vue'
import GenericSummaryForm from './components/GenericSummaryForm.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { db } from '@/services/database'

const activeTab = ref('day') // year, month, week, day
const summaries = ref([])
const loading = ref(false)
const selectedSummary = ref(null)
const isCreating = ref(false)

const loadSummaries = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'day') {
      summaries.value = await db.summaries.listDaily()
    } else {
      summaries.value = await db.summaries.list(activeTab.value)
    }
  } catch (error) {
    console.error('Failed to load summaries', error)
  }
  loading.value = false
}

const handleTabChange = (tabId) => {
  activeTab.value = tabId
  selectedSummary.value = null
  isCreating.value = false
  loadSummaries()
}

const handleSelect = (summary) => {
  selectedSummary.value = summary
  isCreating.value = false
}

const handleCreate = () => {
  selectedSummary.value = null
  isCreating.value = true
}

const handleSave = async (data) => {
  try {
    if (activeTab.value === 'day') {
      const summaryData = { ...data }
      if (selectedSummary.value) {
        summaryData.id = selectedSummary.value.id
      }
      await db.summaries.saveDaily(summaryData)
    } else {
      const summaryData = {
        ...data,
        scope: activeTab.value
      }
      if (selectedSummary.value) {
        await db.summaries.update(selectedSummary.value.id, summaryData)
      } else {
        await db.summaries.create(summaryData)
      }
    }
    
    // Refresh and select
    await loadSummaries()
    isCreating.value = false
  } catch (error) {
    console.error('Failed to save summary', error)
  }
}

const handleCancel = () => {
  isCreating.value = false
  if (!selectedSummary.value && summaries.value.length > 0) {
      // maybe select the first one?
  }
}

const handleDelete = async (id) => {
  if (confirm('确定要删除这条总结吗？')) {
    try {
      if (activeTab.value === 'day') {
        await db.summaries.deleteDaily(id)
      } else {
        await db.summaries.delete(id)
      }
      selectedSummary.value = null
      loadSummaries()
    } catch (error) {
      console.error('Failed to delete summary', error)
    }
  }
}

onMounted(() => {
  loadSummaries()
})

const currentView = computed(() => {
    if (isCreating.value) return 'form'
    if (selectedSummary.value) return 'detail-or-edit' // Reusing form for detail view for now or distinct detail view?
                                                      // For simplicity, let's use the form in "edit mode" or a detail view.
                                                      // The original requirement implied "handwriting" which usually means editing directly.
                                                      // Let's use the Form component for both viewing and editing for now, 
                                                      // perhaps disable it if not in edit mode? 
                                                      // Actually the prompt says "handwrite content", so it's always editable or viewable.
                                                      // Let's just render the form populated with data.
    return 'empty'
})
</script>

<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
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
    <main class="flex-1 h-full relative overflow-hidden bg-zinc-50/50 flex flex-col items-center justify-center p-6 md:p-10">
      
      <div v-if="loading" class="flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="currentView === 'empty'" class="flex flex-col items-center gap-4 text-center max-w-sm">
        <div class="w-12 h-12 rounded-full bg-white border flex items-center justify-center text-muted-foreground">
          <ChevronRight class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold tracking-tight">请选择一条总结</h3>
          <p class="text-sm text-muted-foreground">从左侧列表中选择一个日期或周期来查看和编辑您的回顾。</p>
        </div>
      </div>

      <div v-else class="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">
        <Card class="border-none shadow-xl bg-background rounded-xl overflow-hidden">
          <CardHeader class="pb-6">
            <CardTitle class="text-2xl font-semibold tracking-tight">
              {{ isCreating ? '新增总结' : '编辑总结' }}
            </CardTitle>
            <CardDescription>
              {{ isCreating ? '填写您的反思与感悟，沉淀价值。' : '更新您的回顾内容，完善记录。' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Daily Form -->
            <DailySummaryForm 
              v-if="activeTab === 'day'" 
              :initial-data="selectedSummary"
              @save="handleSave"
              @cancel="handleCancel"
            />

            <!-- Generic Form -->
            <GenericSummaryForm 
              v-else 
              :type="activeTab"
              :initial-data="selectedSummary"
              @save="handleSave"
              @cancel="handleCancel"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
