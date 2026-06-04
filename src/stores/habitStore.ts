// habitStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/database'
import type { Habit, AugmentedHabit } from '@/types/models'

/**
 * 习惯数据统一状态管理
 * 支持乐观更新：先修改本地状态，再同步数据库，失败时回滚
 */
export const useHabitStore = defineStore('habit', () => {
  // ── 状态 ──
  // 所有习惯数据（包含已归档），作为唯一数据源
  // 使用 AugmentedHabit 类型，因为 fetchHabits 会补充日志统计字段
  const allHabits = ref<AugmentedHabit[]>([])

  // 当前选中的习惯 ID，用于详情面板定位
  const selectedHabitId = ref<string | null>(null)

  // 全局 loading 状态，控制列表骨架屏
  const loading = ref(false)

  // ── 计算属性 ──
  // 活跃习惯（过滤掉已归档），供列表页和日程页使用
  const habits = computed(() => allHabits.value.filter(h => !h.is_archived))

  // 已归档习惯，供归档管理页使用
  const archivedHabits = computed(() => allHabits.value.filter(h => h.is_archived))

  // 当前选中的习惯对象，从 allHabits 中按 ID 查找
  const selectedHabit = computed(() =>
    allHabits.value.find(h => h.id === selectedHabitId.value) || null
  )

  // ── Actions ──
  // 从数据库拉取所有习惯数据，页面初始化时调用
  const fetchHabits = async (): Promise<void> => {
    loading.value = true
    try {
      allHabits.value = await db.habit.list() as AugmentedHabit[]
    } catch (e) {
      console.error('获取习惯列表失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 局部更新指定习惯的字段，用于乐观更新场景
  // 仅修改传入的字段，其余字段保持不变
  // 接受 Partial<AugmentedHabit> 以支持日志统计字段的局部更新
  const patchHabit = (id: string, patch: Partial<AugmentedHabit>): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      // spread 后需要显式断言，因为 Partial 展开会产生 undefined 联合类型
      allHabits.value[index] = { ...allHabits.value[index], ...patch } as AugmentedHabit
    }
  }

  // 向列表中添加新习惯，创建成功后立即反映在 UI 上
  const addHabit = (habit: AugmentedHabit): void => {
    allHabits.value.push(habit)
  }

  // 更新指定习惯的完整数据，用于编辑保存后的本地同步
  const updateHabit = (id: string, data: Partial<AugmentedHabit>): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], ...data } as AugmentedHabit
    }
  }

  // 归档指定习惯，归档后从活跃列表中移除但仍保留在 allHabits 中
  const archiveHabit = (id: string): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], is_archived: true } as AugmentedHabit
    }
  }

  // 设置当前选中的习惯 ID，传 null 取消选中
  const setSelectedHabitId = (id: string | null): void => {
    selectedHabitId.value = id
  }

  return {
    allHabits,
    habits,
    archivedHabits,
    selectedHabitId,
    selectedHabit,
    loading,
    fetchHabits,
    patchHabit,
    addHabit,
    updateHabit,
    archiveHabit,
    setSelectedHabitId
  }
})
