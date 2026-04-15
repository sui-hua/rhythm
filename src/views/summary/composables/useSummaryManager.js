import { computed, onMounted, ref } from 'vue'
import { db } from '@/services/database'

/**
 * Summary 模块状态管理 Composable
 * 管理总结列表、当前选中项、创建/编辑状态切换
 */
export const useSummaryManager = () => {
  const activeTab = ref('day')
  const summaries = ref([])
  const loading = ref(false)
  const selectedSummary = ref(null)
  const isCreating = ref(false)

  const loadSummaries = async () => {
    // 根据 activeTab 加载不同类型的总结数据
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
    // 根据类型调用不同的保存方法（日总结 vs 周月年总结）
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
    // 计算当前视图状态：空状态 / 表单编辑 / 详情
    if (isCreating.value) return 'form'
    if (selectedSummary.value) return 'detail-or-edit'
    return 'empty'
  })

  return {
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
  }
}
