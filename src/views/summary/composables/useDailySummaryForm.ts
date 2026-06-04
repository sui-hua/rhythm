/**
 * @fileoverview 每日总结表单 composable
 * 提供每日总结（done/improve/tomorrow）的表单状态管理和预填逻辑。
 */

import type { Ref } from 'vue'
import { ref, watch } from 'vue'

// 每日总结表单数据接口
export interface DailySummaryFormData {
  done: string
  improve: string
  tomorrow: string
}

// 初始数据接口（来自数据库记录）
interface InitialSummaryData {
  content?: Record<string, string>
}

// composable 返回值接口
export interface UseDailySummaryFormReturn {
  formData: Ref<DailySummaryFormData>
  buildPayload: () => DailySummaryFormData
}

/**
 * 每日总结表单 composable
 * 监听初始数据变化，自动填充表单，并提供构建提交载荷的方法。
 *
 * @param initialDataRef - 初始数据的响应式引用
 * @returns 表单状态和构建载荷的方法
 */
export const useDailySummaryForm = (initialDataRef: Ref<InitialSummaryData | null>): UseDailySummaryFormReturn => {
  // 表单数据状态
  const formData = ref<DailySummaryFormData>({
    done: '',
    improve: '',
    tomorrow: ''
  })

  // 监听初始数据变化，自动填充表单
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        // 解析 content 结构：支持对象格式
        const content = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content as Record<string, string>
          : {}

        formData.value = {
          done: content.done ?? '',
          improve: content.improve ?? '',
          tomorrow: content.tomorrow ?? ''
        }
      } else {
        formData.value = { done: '', improve: '', tomorrow: '' }
      }
    },
    { immediate: true }
  )

  // 构建提交载荷，返回当前表单数据的副本
  const buildPayload = (): DailySummaryFormData => ({
    ...formData.value
  })

  return {
    formData,
    buildPayload
  }
}
