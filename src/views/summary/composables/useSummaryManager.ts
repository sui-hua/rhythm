/**
 * @fileoverview Summary 管理器 composable
 * 提供总结模块的核心状态管理，包括 CRUD 操作、tab 切换和视图状态控制。
 */

import type { Ref, ComputedRef } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'
import { buildSummaryPayload } from '@/views/summary/utils/summaryAdapters'
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'
import type { SummaryRecord } from '@/views/summary/utils/summaryAdapters'

// 视图状态类型
type SummaryView = 'form' | 'detail-or-edit' | 'empty'

// composable 返回值接口
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
 * Summary 管理器 composable
 * 整合总结模块的 CRUD 操作、tab 切换和视图状态控制。
 *
 * @returns 总结模块的状态和操作方法
 */
export const useSummaryManager = (): UseSummaryManagerReturn => {
  // 认证状态
  const authStore = useAuthStore()
  // 当前激活的 tab id
  const activeTab = ref('day')
  // 总结列表
  const summaries = ref<SummaryRecord[]>([])
  // 加载状态
  const loading = ref(false)
  // 页面加载状态（loading 的别名）
  const isPageLoading: Ref<boolean> = loading
  // 当前选中的总结
  const selectedSummary = ref<SummaryRecord | null>(null)
  // 是否处于创建模式
  const isCreating = ref(false)

  /**
   * 加载指定类型的总结列表
   * 根据当前 tab id 转换为 kind 后查询数据库
   */
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

  /**
   * 切换 tab 时的处理
   * 重置选中状态并重新加载数据
   *
   * @param tabId - 新的 tab id
   */
  const handleTabChange = (tabId: string): void => {
    activeTab.value = tabId
    selectedSummary.value = null
    isCreating.value = false
    loadSummaries()
  }

  /**
   * 选中一条总结记录
   * @param summary - 要选中的总结对象
   */
  const handleSelect = (summary: SummaryRecord): void => {
    selectedSummary.value = summary
    isCreating.value = false
  }

  /**
   * 进入创建模式
   */
  const handleCreate = (): void => {
    selectedSummary.value = null
    isCreating.value = true
  }

  /**
   * 保存总结数据
   * 构建载荷后调用数据库保存，然后刷新列表
   *
   * @param data - 表单数据
   */
  const handleSave = async (data: Record<string, string>): Promise<void> => {
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

      const savedSummary = await db.summary.save(payload)
      selectedSummary.value = savedSummary
      await loadSummaries()
      isCreating.value = false
    } catch (error) {
      console.error('Failed to save summary', error)
    }
  }

  /**
   * 取消创建/编辑
   */
  const handleCancel = (): void => {
    isCreating.value = false
  }

  /**
   * 删除一条总结记录
   * 删除前需要用户确认，删除后刷新列表
   *
   * @param id - 要删除的记录 ID
   */
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

  // 当前视图状态计算
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
