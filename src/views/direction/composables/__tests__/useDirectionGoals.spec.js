import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionStore } from '@/stores/directionStore'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { db } from '@/services/database'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn()
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
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

vi.mock('@/views/direction/composables/useDirectionFetch', () => ({
  useDirectionFetch: () => ({
    fetchData: vi.fn(),
    loadMonthlyPlans: vi.fn()
  })
}))

beforeEach(() => {
  vi.clearAllMocks()
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useDirectionStore()
  store.reset()
})

describe('useDirectionGoals', () => {
  it('handles add click correctly', async () => {
    const { handleAddClick, editingGoal, showAddModal } = useDirectionGoals()
    
    handleAddClick()
    
    expect(editingGoal.value).toBe(null)
    expect(showAddModal.value).toBe(true)
  })

  it('derives editable month bounds from date-only monthly plan strings', async () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' },
        { id: 'mp-2', plan_id: 'p1', month: '2026-07-01' }
      ]
    })
    store.selectedGoal.value = { plan_id: 'p1', title: '目标' }

    const { handleEditGoal, editingGoal } = useDirectionGoals()

    await handleEditGoal({
      plan_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(editingGoal.value.startMonth).toBe(4)
    expect(editingGoal.value.endMonth).toBe(7)
  })

  it('uses date-only month values when saving monthly plans', async () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
      ]
    })
    store.selectedGoal.value = { plan_id: 'p1', title: '目标' }
    store.selectedMonth.value = 4

    const { saveMonthlyPlan } = useDirectionGoals()
    await saveMonthlyPlan(4, { title: '更新标题' })

    expect(db.monthlyPlans.update).toHaveBeenCalledWith('mp-1', {
      title: '更新标题'
    })
  })
})
