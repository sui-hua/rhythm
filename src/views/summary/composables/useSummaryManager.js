/**
 * ============================================
 * Summary 模块状态管理 (views/summary/composables/useSummaryManager.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理总结模块的全局状态
 * - 处理总结的创建、编辑、删除、查询
 * - 支持日/周/月/年四种总结类型
 *
 * 【状态管理】
 * - activeTab       → 当前标签页（day/week/month/year）
 * - summaries       → 当前类型下的总结列表
 * - selectedSummary  → 当前选中的总结
 * - isCreating       → 是否处于创建模式
 * - currentView      → 计算属性：form/detail-or-edit/empty
 *
 * 【操作处理】
 * - handleTabChange() → 切换标签页
 * - handleSelect()    → 选中某个总结
 * - handleCreate()    → 进入创建模式
 * - handleSave()      → 保存总结
 * - handleDelete()    → 删除总结
 */
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'
import { buildSummaryPayload } from '@/views/summary/utils/summaryAdapters'
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'

/**
 * Summary 模块组合式函数
 * 
 * @description 管理总结模块的全局状态和业务逻辑，包括日/周/月/年四种总结类型的
 * 创建、编辑、删除、查询操作。采用 Vue 3 Composition API 模式，与组件解耦。
 * 
 * @returns {Object} 包含状态和操作方法的对象
 * @returns {Ref<string>} returns.activeTab - 当前选中的标签页（day/week/month/year）
 * @returns {Ref<Array>} returns.summaries - 当前类型下的总结列表
 * @returns {Ref<boolean>} returns.loading - 加载状态
 * @returns {Ref<boolean>} returns.isPageLoading - 页面级加载状态（loading 的别名）
 * @returns {Ref<Object|null>} returns.selectedSummary - 当前选中的总结对象
 * @returns {Ref<boolean>} returns.isCreating - 是否处于创建/编辑模式
 * @returns {ComputedRef<string>} returns.currentView - 当前视图类型：form/detail-or-edit/empty
 * @returns {Function} returns.handleTabChange - 切换标签页
 * @returns {Function} returns.handleSelect - 选中某个总结
 * @returns {Function} returns.handleCreate - 进入创建模式
 * @returns {Function} returns.handleSave - 保存总结
 * @returns {Function} returns.handleCancel - 取消创建/编辑
 * @returns {Function} returns.handleDelete - 删除总结
 */
export const useSummaryManager = () => {
  const authStore = useAuthStore()
  const activeTab = ref('day')
  const summaries = ref([])
  const loading = ref(false)
  const isPageLoading = loading // alias for consistency
  const selectedSummary = ref(null)
  const isCreating = ref(false)

  /**
   * 加载指定类型的总结列表
   * 
   * @description 根据当前 activeTab 对应的类型，从数据库加载总结列表。
   * 加载过程中会设置 loading 状态，失败时清空列表并输出错误日志。
   * 
   * @returns {Promise<void>}
   */
  const loadSummaries = async () => {
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
   * 切换标签页
   * 
   * @description 切换日/周/月/年标签页，重置选中状态和创建状态，
   * 然后重新加载对应类型的总结列表。
   * 
   * @param {string} tabId - 标签页标识（day/week/month/year）
   * @returns {void}
   */
  const handleTabChange = (tabId) => {
    activeTab.value = tabId
    selectedSummary.value = null
    isCreating.value = false
    loadSummaries()
  }

  /**
   * 选中某个总结
   * 
   * @description 设置当前选中的总结对象，退出创建模式。
   * 选中后 currentView 会变为 'detail-or-edit'。
   * 
   * @param {Object} summary - 要选中的总结对象
   * @param {number} summary.id - 总结 ID
   * @returns {void}
   */
  const handleSelect = (summary) => {
    selectedSummary.value = summary
    isCreating.value = false
  }

  /**
   * 进入创建模式
   * 
   * @description 清空当前选中，启用创建模式。
   * 创建后 currentView 会变为 'form'。
   * 
   * @returns {void}
   */
  const handleCreate = () => {
    selectedSummary.value = null
    isCreating.value = true
  }

  /**
   * 保存总结
   * 
   * @description 创建或更新总结。流程：
   * 1. 验证用户登录状态
   * 2. 确定时间周期（编辑时复用原周期，新建时生成默认周期）
   * 3. 构建数据载荷
   * 4. 调用数据库保存
   * 5. 更新选中状态并刷新列表
   * 
   * @param {Object} data - 表单数据（内容、心情等）
   * @returns {Promise<void>}
   */
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
   * 
   * @description 退出创建模式，保持当前选中不变。
   * 
   * @returns {void}
   */
  const handleCancel = () => {
    isCreating.value = false
  }

  /**
   * 删除总结
   * 
   * @description 删除指定 ID 的总结。删除前会弹出确认对话框，
   * 删除成功后清空选中状态并刷新列表。
   * 
   * @param {number} id - 要删除的总结 ID
   * @returns {Promise<void>}
   */
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条总结吗？')) return

    try {
      await db.summary.remove(id)
      selectedSummary.value = null
      await loadSummaries()
    } catch (error) {
      console.error('Failed to delete summary', error)
    }
  }

  onMounted(() => {
    loadSummaries()
  })

  /**
   * 计算当前视图类型
   * 
   * @description 根据 isCreating 和 selectedSummary 状态，
   * 计算并返回当前应该显示的视图类型。
   * 
   * @returns {string} 视图类型：
   *  - 'form': 创建/编辑表单视图
   *  - 'detail-or-edit': 详情或可编辑视图
   *  - 'empty': 空状态视图
   */
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
