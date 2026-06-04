import { defineStore } from 'pinia'
import { ref } from 'vue'

// 引导步骤类型
type OnboardingStep = 'open-day' | 'create-first-habit' | 'create-first-goal' | 'write-first-summary'

const defaultSteps: OnboardingStep[] = [
  'open-day',
  'create-first-habit',
  'create-first-goal',
  'write-first-summary'
]

export const useOnboardingStore = defineStore('onboarding', () => {
  // 引导弹窗是否可见
  const visible = ref(false)
  // 已完成的步骤列表
  const completedSteps = ref<OnboardingStep[]>([])
  // 当前激活的步骤
  const activeStep = ref<OnboardingStep | null>(
    defaultSteps.find((step) => !completedSteps.value.includes(step)) ?? defaultSteps[defaultSteps.length - 1] ?? null
  )

  // 开始引导流程，定位到第一个未完成的步骤
  function start(): void {
    visible.value = true
    activeStep.value = defaultSteps.find((step) => !completedSteps.value.includes(step)) ?? defaultSteps[0] ?? null
  }

  // 标记指定步骤为已完成，自动前进到下一个未完成步骤
  function completeStep(step: OnboardingStep): void {
    if (!completedSteps.value.includes(step)) completedSteps.value.push(step)
    activeStep.value = defaultSteps.find((item) => !completedSteps.value.includes(item)) || null
  }

  // 所向模块引导完成状态，用于控制方向模块首次引导弹窗
  const directionGuideCompleted = ref(false)

  // 标记所向模块引导已完成，后续进入不再显示
  const completeDirectionGuide = (): void => {
    directionGuideCompleted.value = true
  }

  // 结束引导流程，关闭弹窗
  function finish(): void {
    visible.value = false
    activeStep.value = null
  }

  return { visible, completedSteps, activeStep, start, completeStep, finish, directionGuideCompleted, completeDirectionGuide }
}, {
  persist: {
    pick: ['completedSteps', 'directionGuideCompleted']
  }
})
