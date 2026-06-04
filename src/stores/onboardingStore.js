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
  const activeStep = ref(
    defaultSteps.find((step) => !completedSteps.value.includes(step)) || defaultSteps[defaultSteps.length - 1]
  )

  function start() {
    visible.value = true
    activeStep.value = defaultSteps.find((step) => !completedSteps.value.includes(step)) || defaultSteps[0]
  }

  function completeStep(step) {
    if (!completedSteps.value.includes(step)) completedSteps.value.push(step)
    activeStep.value = defaultSteps.find((item) => !completedSteps.value.includes(item)) || null
  }

  // 所向模块引导完成状态，用于控制方向模块首次引导弹窗
  const directionGuideCompleted = ref(false)

  // 标记所向模块引导已完成，后续进入不再显示
  const completeDirectionGuide = () => {
    directionGuideCompleted.value = true
  }

  function finish() {
    visible.value = false
    activeStep.value = null
  }

  return { visible, completedSteps, activeStep, start, completeStep, finish, directionGuideCompleted, completeDirectionGuide }
}, {
  persist: {
    pick: ['completedSteps', 'directionGuideCompleted']
  }
})
