// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { TASK_CATEGORY_STORAGE_KEY, useTaskCategories } from '../useTaskCategories'

describe('useTaskCategories', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('无本地配置时使用传入分类并选中第一个分类', () => {
    const selectedCategory = ref('')

    const { categories } = useTaskCategories(['工作', '个人'], selectedCategory)

    expect(categories.value).toEqual(['工作', '个人'])
    expect(selectedCategory.value).toBe('工作')
  })

  it('新增分类时去除首尾空格、选中新分类并写入 localStorage', () => {
    const selectedCategory = ref('工作')
    const { categories, newCategoryName, addCategory } = useTaskCategories(['工作'], selectedCategory)

    newCategoryName.value = '  学习  '
    addCategory()

    expect(categories.value).toEqual(['工作', '学习'])
    expect(selectedCategory.value).toBe('学习')
    expect(JSON.parse(localStorage.getItem(TASK_CATEGORY_STORAGE_KEY) || '[]')).toEqual(['工作', '学习'])
  })

  it('删除当前选中分类后自动选中剩余第一个分类', () => {
    const selectedCategory = ref('个人')
    const { categories, removeCategory } = useTaskCategories(['工作', '个人'], selectedCategory)

    removeCategory('个人')

    expect(categories.value).toEqual(['工作'])
    expect(selectedCategory.value).toBe('工作')
  })

  it('新增重复分类时只切换选中项，不重复写入列表', () => {
    const selectedCategory = ref('工作')
    const { categories, newCategoryName, addCategory } = useTaskCategories(['工作', '个人'], selectedCategory)

    newCategoryName.value = '个人'
    addCategory()

    expect(categories.value).toEqual(['工作', '个人'])
    expect(selectedCategory.value).toBe('个人')
  })
})
