// useSummaryManager.ts
// Summary 模块的核心状态管理，整合 CRUD、tab 切换和视图状态

import type { Ref, ComputedRef } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { safeAction } from '@/utils/safeAction'
import { buildDefaultPeriod } from '@/services/db/summaryPeriods'
import { buildSummaryPayload } from '@/services/db/summaryAdapters'
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'
import { fetchTodayDataOverview } from '@/views/summary/composables/useSummaryPrefill'
import { confirmDelete } from '@/composables/useDeleteConfirm'
import type { SummaryRecord } from '@/services/db/summaryAdapters'

// 视图状态类型：表单编辑 / 详情展示 / 空状态
type SummaryView = 'form' | 'detail-or-edit' | 'empty'

// useSummaryManager composable 的返回值类型
export interface UseSummaryManagerReturn {
  activeTab: Ref<string>
  summaries: Ref<SummaryRecord[]>
  loading: Ref<boolean>
  isPageLoading: Ref<boolean>
  selectedSummary: Ref<SummaryRecord | null>
  prefilledSummary: Ref<SummaryRecord | null>
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
  // 新建日总结时的预填数据，由今日任务和习惯数据自动聚合生成
  const prefilledSummary = ref<SummaryRecord | null>(null)

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

  /**
   * 构建日总结的默认内容（数据自动聚合）
   *
   * 当日总结为空时，自动拉取今日任务完成和习惯打卡数据，
   * 生成可编辑的默认模板文字，减少用户手动输入。
   *
   * @returns 默认 content 对象，获取失败时返回空对象
   */
  const buildDailyDefaultContent = async (): Promise<Record<string, string>> => {
    try {
      const overview = await fetchTodayDataOverview()
      const doneLines: string[] = []

      // 聚合已完成任务标题
      if (overview.completedTaskTitles.length > 0) {
        doneLines.push(...overview.completedTaskTitles)
      }

      // 聚合习惯打卡统计
      if (overview.habitLogCount > 0) {
        doneLines.push(`完成 ${overview.habitLogCount} 项习惯打卡`)
      }

      return {
        done: doneLines.length > 0 ? doneLines.join('\n') : '',
        improve: '',
        tomorrow: ''
      }
    } catch (error) {
      console.warn('自动聚合今日数据失败:', error)
      return {}
    }
  }

  // 切换 tab：重置选中状态并重新加载对应类型的数据
  const handleTabChange = (tabId: string): void => {
    activeTab.value = tabId
    selectedSummary.value = null
    prefilledSummary.value = null
    isCreating.value = false
    loadSummaries()
  }

  // 选中一条总结记录，进入详情/编辑视图
  const handleSelect = (summary: SummaryRecord): void => {
    selectedSummary.value = summary
    isCreating.value = false
  }

  // 进入创建模式，清空选中状态；日总结时自动聚合今日数据作为表单默认内容
  const handleCreate = async (): Promise<void> => {
    selectedSummary.value = null
    prefilledSummary.value = null
    isCreating.value = true

    // 日总结 tab 下自动聚合今日任务和习惯数据
    if (activeTab.value === 'day') {
      const defaultContent = await buildDailyDefaultContent()
      if (Object.keys(defaultContent).length > 0) {
        prefilledSummary.value = { content: defaultContent } as SummaryRecord
      }
    }
  }

  // 保存总结数据：构建 payload → 写入数据库 → 刷新列表
  const handleSave = async (data: Record<string, string>): Promise<void> => {
    await safeAction(async () => {
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

      // 已有记录走更新，新记录走创建
      let savedSummary
      if (existingSummary?.id) {
        savedSummary = await db.summary.update(existingSummary.id, payload)
      } else {
        savedSummary = await db.summary.create(payload)
      }

      selectedSummary.value = savedSummary as SummaryRecord
      await loadSummaries()
      isCreating.value = false
    }, 'Failed to save summary')
  }

  // 取消创建/编辑，退出表单视图并清空预填数据
  const handleCancel = (): void => {
    isCreating.value = false
    prefilledSummary.value = null
  }

  // 删除总结记录：确认后删除并刷新列表
  const handleDelete = async (id: string | number): Promise<void> => {
    if (!confirmDelete('summary')) return

    await safeAction(async () => {
      await db.summary.delete(id)
      selectedSummary.value = null
      await loadSummaries()
    }, 'Failed to delete summary')
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
    prefilledSummary,
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
