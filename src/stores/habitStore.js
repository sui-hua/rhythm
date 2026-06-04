import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/database'

// 习惯数据统一状态管理，支持乐观更新
export const useHabitStore = defineStore('habit', () => {
  // 所有习惯数据（包含已归档）
  const allHabits = ref([])

  // 当前选中的习惯 ID
  const selectedHabitId = ref(null)

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
  const fetchHabits = async () => {
    loading.value = true
    try {
      allHabits.value = await db.habit.list()
    } catch (e) {
      console.error('获取习惯列表失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 局部更新指定习惯的字段（用于乐观更新）
  const patchHabit = (id, patch) => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], ...patch }
    }
  }

  // 向列表中添加新习惯
  const addHabit = (habit) => {
    allHabits.value.push(habit)
  }

  // 更新指定习惯的完整数据
  const updateHabit = (id, data) => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], ...data }
    }
  }

  // 归档指定习惯
  const archiveHabit = (id) => {
    const index = allHabits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      allHabits.value[index] = { ...allHabits.value[index], is_archived: true }
    }
  }

  // 设置当前选中的习惯 ID
  const setSelectedHabitId = (id) => {
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
