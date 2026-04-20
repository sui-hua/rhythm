/**
 * Onboarding Store
 *
 * Manages the new user onboarding flow for the Rhythm app.
 * Tracks completed steps and controls the onboarding modal visibility.
 *
 * Steps (in order):
 * 1. open-day      - Welcome / open the day
 * 2. create-first-habit  - Create first habit
 * 3. create-first-goal   - Create first goal/direction
 * 4. write-first-summary - Write first summary
 *
 * Persists completedSteps to localStorage so progress survives refreshes.
 * Use start() to show the onboarding modal, completeStep() to advance,
 * and finish() to close it.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const defaultSteps = [
  'open-day',
  'create-first-habit',
  'create-first-goal',
  'write-first-summary'
]

export const useOnboardingStore = defineStore('onboarding', () => {
  const visible = ref(false)
  const completedSteps = ref([])
  const activeStep = ref(defaultSteps[0])

  function start() {
    visible.value = true
    activeStep.value = defaultSteps.find((step) => !completedSteps.value.includes(step)) || defaultSteps[0]
  }

  function completeStep(step) {
    if (!completedSteps.value.includes(step)) completedSteps.value.push(step)
    activeStep.value = defaultSteps.find((item) => !completedSteps.value.includes(item)) || null
  }

  function finish() {
    visible.value = false
    activeStep.value = null
  }

  return { visible, completedSteps, activeStep, start, completeStep, finish }
}, {
  persist: {
    pick: ['completedSteps']
  }
})
