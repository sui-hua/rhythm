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
