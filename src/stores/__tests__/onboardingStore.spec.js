import { setActivePinia, createPinia } from 'pinia'
import { describe, expect, it, beforeEach } from 'vitest'
import { useOnboardingStore } from '@/stores/onboardingStore'

describe('onboarding store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks steps as completed and closes the overlay', () => {
    const store = useOnboardingStore()
    store.start()
    store.completeStep('create-first-habit')
    store.finish()

    expect(store.completedSteps).toContain('create-first-habit')
    expect(store.visible).toBe(false)
  })
})
