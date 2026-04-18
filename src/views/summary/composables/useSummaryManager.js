import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'
import { buildSummaryPayload } from '@/views/summary/utils/summaryAdapters'
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'

export const useSummaryManager = () => {
  const authStore = useAuthStore()
  const activeTab = ref('day')
  const summaries = ref([])
  const loading = ref(false)
  const isPageLoading = loading // alias for consistency
  const selectedSummary = ref(null)
  const isCreating = ref(false)

  const loadSummaries = async () => {
    loading.value = true
    try {
      summaries.value = await db.summaries.listByKind(summaryTabToKind(activeTab.value))
    } catch (error) {
      console.error('Failed to load summaries', error)
      summaries.value = []
    } finally {
      loading.value = false
    }
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
      const userId = authStore.userId
      if (!userId) {
        throw new Error('当前用户未登录，无法保存总结')
      }

      const kind = summaryTabToKind(activeTab.value)
      const existingSummary = selectedSummary.value
      const period = existingSummary?.period_start && existingSummary?.period_end
        ? {
            periodStart: existingSummary.period_start,
            periodEnd: existingSummary.period_end
          }
        : buildDefaultPeriod(kind, existingSummary?.created_at ? new Date(existingSummary.created_at) : new Date())

      const payload = buildSummaryPayload({
        kind,
        userId,
        period,
        formData: data,
        existingRecord: existingSummary
      })

      const savedSummary = await db.summaries.save(payload)
      selectedSummary.value = savedSummary
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
      await db.summaries.remove(id)
      selectedSummary.value = null
      await loadSummaries()
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
