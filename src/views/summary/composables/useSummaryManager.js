import { computed, onMounted, ref } from 'vue'
import { db } from '@/services/database'

export const useSummaryManager = () => {
  const activeTab = ref('day')
  const summaries = ref([])
  const loading = ref(false)
  const isPageLoading = loading // alias for consistency
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

      await loadSummaries()
      isCreating.value = false
    } catch (error) {
      console.error('Failed to save summary', error)
    }
  }

  const handleCancel = () => {
    isCreating.value = false
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条总结吗？')) return

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

  onMounted(() => {
    loadSummaries()
  })

  const currentView = computed(() => {
    if (isCreating.value) return 'form'
    if (selectedSummary.value) return 'detail-or-edit'
    return 'empty'
  })

  return {
    activeTab,
    summaries,
    loading,
    isPageLoading,
    selectedSummary,
    isCreating,
    currentView,
    handleTabChange,
    handleSelect,
    handleCreate,
    handleSave,
    handleCancel,
    handleDelete
  }
}
