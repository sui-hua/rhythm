import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/database'
import type { Habit } from '@/types/models'

// 习惯数据统一状态管理，支持乐观更新
export const useHabitStore = defineStore('habit', () => {
  // 所有习惯数据（包含已归档）
  const allHabits = ref<Habit[]>([])

  // 当前选中的习惯 ID
  const selectedHabitId = ref<string | null>(null)

  // 全局 loading 状态
  const loading = ref(false)

  // 活跃习惯（过滤掉已归档）
  const habits = computed(() => allHabits.value.filter(h => !h.is_archived))

  // 已归档习惯
  const archivedHabits = computed(() => allHabits.value.filter(h => h.is_archived))

  // 当前选中的习惯对象
  const selectedHabit = computed(() =>
    allHabits.value.find(h => h.id === selectedHabitId.value) || null
  )

  // 从数据库拉取所有习惯数据
  const fetchHabits = async (): Promise<void> => {
    loading.value = true
    try {
      allHabits.value = await db.habit.list() as unknown as Habit[]
    } catch (e) {
      console.error('获取习惯列表失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 局部更新指定习惯的字段（用于乐观更新）
  const patchHabit = (id: string, patch: Partial<Habit>): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], ...patch } as Habit
    }
  }

  // 向列表中添加新习惯
  const addHabit = (habit: Habit): void => {
    allHabits.value.push(habit)
  }

  // 更新指定习惯的完整数据
  const updateHabit = (id: string, data: Partial<Habit>): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], ...data } as Habit
    }
  }

  // 归档指定习惯
  const archiveHabit = (id: string): void => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], is_archived: true } as Habit
    }
  }

  // 设置当前选中的习惯 ID
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
