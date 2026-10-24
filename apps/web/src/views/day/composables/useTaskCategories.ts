import { ref, type Ref } from 'vue'

export const TASK_CATEGORY_STORAGE_KEY = 'rhythm.taskCategories'

export const DEFAULT_TASK_CATEGORIES = ['工作', '个人', '会议', '设计', '其他']

// 过滤分类名称，确保本地存储恢复后仍是可展示的非空字符串数组。
function sanitizeCategories(categories: unknown): string[] {
  if (!Array.isArray(categories)) return []

  return Array.from(new Set(
    categories
      .map(category => String(category).trim())
      .filter(Boolean)
  ))
}

// 从 localStorage 读取用户自定义分类，异常或空数组时回退到传入默认值。
function readStoredCategories(fallbackCategories: string[]): string[] {
  if (typeof localStorage === 'undefined') return fallbackCategories

  try {
    const storedValue = localStorage.getItem(TASK_CATEGORY_STORAGE_KEY)
    if (!storedValue) return fallbackCategories

    const storedCategories = sanitizeCategories(JSON.parse(storedValue))
    return storedCategories.length > 0 ? storedCategories : fallbackCategories
  } catch {
    return fallbackCategories
  }
}

// 写入 localStorage，保存失败时静默跳过，避免影响任务创建主流程。
function writeStoredCategories(categories: string[]) {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(TASK_CATEGORY_STORAGE_KEY, JSON.stringify(categories))
  } catch {
    // localStorage 不可用时分类仍可在当前弹框会话内使用。
  }
}

/**
 * 管理新增任务弹框中的快捷分类。
 *
 * 使用场景：Day 模块 AddEventModal 的任务分类选择与轻量管理。
 * 数据流：props 默认分类/localStorage → categories → eventForm.category
 */
export function useTaskCategories(
  initialCategories: string[] = DEFAULT_TASK_CATEGORIES,
  selectedCategory: Ref<string>
) {
  // 规范化传入分类，确保没有空项和重复项。
  const fallbackCategories = sanitizeCategories(initialCategories)
  const initialList = readStoredCategories(
    fallbackCategories.length > 0 ? fallbackCategories : DEFAULT_TASK_CATEGORIES
  )

  // 当前可选分类列表，会随新增/删除同步到 localStorage。
  const categories = ref(initialList)
  // 是否展开分类管理区。
  const managingCategories = ref(false)
  // 新分类输入值。
  const newCategoryName = ref('')

  // 初始化选中项，避免表单 category 留空。
  if (!selectedCategory.value && categories.value.length > 0) {
    selectedCategory.value = categories.value[0] || ''
  }

  // 新增分类：自动去重，重复时只切换选中项。
  function addCategory() {
    const categoryName = newCategoryName.value.trim()
    if (!categoryName) return false

    if (!categories.value.includes(categoryName)) {
      categories.value = [...categories.value, categoryName]
      writeStoredCategories(categories.value)
    }

    selectedCategory.value = categoryName
    newCategoryName.value = ''
    return true
  }

  // 删除分类：删除当前选中项后回落到剩余第一项。
  function removeCategory(categoryName: string) {
    categories.value = categories.value.filter(category => category !== categoryName)

    if (selectedCategory.value === categoryName) {
      selectedCategory.value = categories.value[0] || ''
    }

    writeStoredCategories(categories.value)
  }

  return {
    categories,
    managingCategories,
    newCategoryName,
    addCategory,
    removeCategory
  }
}
