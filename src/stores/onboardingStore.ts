// onboardingStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'

// 引导步骤类型，定义新用户引导的四个关键节点
type OnboardingStep = 'open-day' | 'create-first-habit' | 'create-first-goal' | 'write-first-summary'

// 默认步骤顺序，引导用户从查看日程到创建习惯、目标、最后写总结
const defaultSteps: OnboardingStep[] = [
  'open-day',
  'create-first-habit',
  'create-first-goal',
  'write-first-summary'
]

/**
 * 新用户引导状态管理
 * persist: 部分持久化 → completedSteps 和 directionGuideCompleted 同步到 localStorage
 * 仅持久化已完成步骤，避免弹窗状态跨会话残留
 */
export const useOnboardingStore = defineStore('onboarding', () => {
  // ── 状态 ──
  // 引导弹窗是否可见
  const visible = ref(false)
  // 已完成的步骤列表，持久化后刷新页面仍保留进度
  const completedSteps = ref<OnboardingStep[]>([])
  // 当前激活的步骤，初始化时定位到第一个未完成的步骤
  const activeStep = ref<OnboardingStep | null>(
    defaultSteps.find((step) => !completedSteps.value.includes(step)) ?? defaultSteps[defaultSteps.length - 1] ?? null
  )

  // ── Actions ──
  // 开始引导流程，显示弹窗并定位到第一个未完成的步骤
  function start(): void {
    visible.value = true
    activeStep.value = defaultSteps.find((step) => !completedSteps.value.includes(step)) ?? defaultSteps[0] ?? null
  }

  // 标记指定步骤为已完成，自动前进到下一个未完成步骤
  // 重复完成同一步骤不会产生重复记录
  function completeStep(step: OnboardingStep): void {
    if (!completedSteps.value.includes(step)) completedSteps.value.push(step)
    activeStep.value = defaultSteps.find((item) => !completedSteps.value.includes(item)) || null
  }

  // 所向模块（Direction）引导完成状态，控制首次进入时的引导弹窗
  const directionGuideCompleted = ref(false)

  // 标记所向模块引导已完成，后续进入不再显示引导弹窗
  const completeDirectionGuide = (): void => {
    directionGuideCompleted.value = true
  }

  // 结束引导流程，关闭弹窗并清除当前步骤
  function finish(): void {
    visible.value = false
    activeStep.value = null
  }

  return { visible, completedSteps, activeStep, start, completeStep, finish, directionGuideCompleted, completeDirectionGuide }
}, {
  persist: {
    // 仅持久化完成状态，不持久化 visible/activeStep 避免刷新后弹窗残留
    pick: ['completedSteps', 'directionGuideCompleted']
  }
})
