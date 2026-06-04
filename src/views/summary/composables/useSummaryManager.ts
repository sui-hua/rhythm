// useSummaryManager.ts
// Summary 模块的核心状态管理，整合 CRUD、tab 切换和视图状态

import type { Ref, ComputedRef } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'
import { buildSummaryPayload } from '@/views/summary/utils/summaryAdapters'
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'
import type { SummaryRecord } from '@/views/summary/utils/summaryAdapters'

// 视图状态类型：表单编辑 / 详情展示 / 空状态
type SummaryView = 'form' | 'detail-or-edit' | 'empty'

// useSummaryManager composable 的返回值类型
export interface UseSummaryManagerReturn {
  activeTab: Ref<string>
  summaries: Ref<SummaryRecord[]>
  loading: Ref<boolean>
  isPageLoading: Ref<boolean>
  selectedSummary: Ref<SummaryRecord | null>
  isCreating: Ref<boolean>
  currentView: ComputedRef<SummaryView>
  handleTabChange: (tabId: string) => void
  handleSelect: (summary: SummaryRecord) => void
  handleCreate: () => void
  handleSave: (data: Record<string, string>) => Promise<void>
  handleCancel: () => void
  handleDelete: (id: string | number) => Promise<void>
}

/**
 * 总结模块状态管理器
 *
 * 使用场景：Summary 页面，管理日/周/月/年总结的增删改查和视图切换
 * 数据流：Supabase → summaries (Ref) → 组件；操作方法直接写数据库后刷新列表
 *
 * @returns 总结模块的状态和操作方法
 */
export const useSummaryManager = (): UseSummaryManagerReturn => {
  const authStore = useAuthStore()
  // 当前激活的 tab id，默认展示日总结
  const activeTab = ref('day')
  // 当前类型的总结列表
  const summaries = ref<SummaryRecord[]>([])
  // 数据加载状态
  const loading = ref(false)
  // isPageLoading 是 loading 的别名，供页面级骨架屏使用
  const isPageLoading: Ref<boolean> = loading
  // 当前选中查看/编辑的总结记录
  const selectedSummary = ref<SummaryRecord | null>(null)
  // 是否处于新建模式，与选中状态互斥
  const isCreating = ref(false)

  // 根据当前 tab id 转换为 kind 后查询数据库
  const loadSummaries = async (): Promise<void> => {
    loading.value = true
    try {
      summaries.value = await db.summary.listByKind(summaryTabToKind(activeTab.value))
    } catch (error) {
      console.error('Failed to load summaries', error)
      summaries.value = []
    } finally {
      loading.value = false
    }
  }

  // 切换 tab：重置选中状态并重新加载对应类型的数据
  const handleTabChange = (tabId: string): void => {
    activeTab.value = tabId
    selectedSummary.value = null
    isCreating.value = false
    loadSummaries()
  }

  // 选中一条总结记录，进入详情/编辑视图
  const handleSelect = (summary: SummaryRecord): void => {
    selectedSummary.value = summary
    isCreating.value = false
  }

  // 进入创建模式，清空选中状态
  const handleCreate = (): void => {
    selectedSummary.value = null
    isCreating.value = true
  }

  // 保存总结数据：构建 payload → 写入数据库 → 刷新列表
  const handleSave = async (data: Record<string, string>): Promise<void> => {
    try {
      const userId = authStore.userId
      if (!userId) {
        throw new Error('当前用户未登录，无法保存总结')
      }

      const kind = summaryTabToKind(activeTab.value)
      const existingSummary = selectedSummary.value
      // 编辑时复用原有周期，新建时按 kind 和当前时间生成默认周期
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

      const savedSummary = await db.summary.save(payload)
      selectedSummary.value = savedSummary
      await loadSummaries()
      isCreating.value = false
    } catch (error) {
      console.error('Failed to save summary', error)
    }
  }

  // 取消创建/编辑，退出表单视图
  const handleCancel = (): void => {
    isCreating.value = false
  }

  // 删除总结记录：确认后删除并刷新列表
  const handleDelete = async (id: string | number): Promise<void> => {
    if (!confirm('确定要删除这条总结吗？')) return

    try {
      await db.summary.remove(id)
      selectedSummary.value = null
      await loadSummaries()
    } catch (error) {
      console.error('Failed to delete summary', error)
    }
  }

  // 页面挂载时加载初始数据
  onMounted(() => {
    loadSummaries()
  })

  // 根据当前状态派生视图类型：创建中 → 表单；已选中 → 详情；否则 → 空状态
  const currentView = computed((): SummaryView => {
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
