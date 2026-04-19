import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionStore } from '@/stores/directionStore'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { db } from '@/services/database'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

vi.mock('@/views/direction/composables/useDirectionFetch', () => ({
  useDirectionFetch: () => ({
    fetchData: vi.fn().mockResolvedValue(undefined),
    loadMonthlyPlans: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/services/database', () => ({
  db: {
    plans: {
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({ id: 'new-plan' }),
      delete: vi.fn().mockResolvedValue({})
    },
    monthlyPlans: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
  const pinia = createPinia()
  setActivePinia(pinia)
  // Ensure store is fresh for each test
  useDirectionStore().reset()
})

describe('useDirectionGoals', () => {
  it('handles add click correctly', async () => {
    const store = useDirectionStore()
    const { handleAddClick } = useDirectionGoals()
    
    handleAddClick()
    
    expect(store.editingGoal.value).toBe(null)
    expect(store.showAddModal.value).toBe(true)
  })

  it('derives editable month bounds from date-only monthly plan strings', async () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' },
        { id: 'mp-2', plan_id: 'p1', month: '2026-07-01' }
      ]
    })

    const { handleEditGoal } = useDirectionGoals()

    await handleEditGoal({
      plan_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(store.editingGoal.value.startMonth).toBe(4)
    expect(store.editingGoal.value.endMonth).toBe(7)
  })

  it('uses date-only month values when saving monthly plans', async () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
      ]
    })
    store.selectedGoal = { plan_id: 'p1' }
    store.selectedMonth = 4

    const { saveMonthlyPlan } = useDirectionGoals()
    await saveMonthlyPlan(4, { title: '更新标题' })

    expect(db.monthlyPlans.update).toHaveBeenCalledWith('mp-1', {
      title: '更新标题'
    })
  })
})
