/**
 * @fileoverview 通用总结表单 composable
 * 提供周/月/年总结的表单状态管理和预填逻辑。
 */

import type { Ref, ComputedRef } from 'vue'
import { computed, ref, watch } from 'vue'

// 通用总结表单数据接口
export interface GenericSummaryFormData {
  title: string
  text: string
}

// 初始数据接口（来自数据库记录）
interface InitialSummaryData {
  title?: string
  content?: string | Record<string, string>
}

// composable 返回值接口
export interface UseGenericSummaryFormReturn {
  title: Ref<string>
  content: Ref<string>
  typeName: ComputedRef<string>
  placeholderText: ComputedRef<string>
  buildPayload: () => GenericSummaryFormData
}

/**
 * 通用总结表单 composable
 * 监听初始数据和类型变化，自动填充表单，并提供构建提交载荷的方法。
 *
 * @param initialDataRef - 初始数据的响应式引用
 * @param typeRef - 总结类型（week/month/year）的响应式引用
 * @returns 表单状态、计算属性和构建载荷的方法
 */
export const useGenericSummaryForm = (
  initialDataRef: Ref<InitialSummaryData | null>,
  typeRef: Ref<string>
): UseGenericSummaryFormReturn => {
  // 标题状态
  const title = ref('')
  // 内容状态
  const content = ref('')

  // 监听初始数据变化，自动填充表单
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        // 解析 content 结构：支持对象 { text } 格式或直接字符串
        const summaryContent = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content as Record<string, string>
          : {}

        title.value = newVal.title ?? ''
        content.value = summaryContent.text ?? (typeof newVal.content === 'string' ? newVal.content : '')
      } else {
        // 数据重置
        title.value = ''
        content.value = ''
      }
    },
    { immediate: true }
  )

  // 根据类型计算中文类型名
  const typeName = computed((): string => {
    if (typeRef.value === 'week') return '周'
    if (typeRef.value === 'month') return '月'
    return '年'
  })

  // 占位符文本
  const placeholderText = computed((): string => `在这里写下您的${typeName.value}总结...`)

  // 构建提交载荷
  const buildPayload = (): GenericSummaryFormData => ({
    title: title.value.trim(),
    text: content.value
  })

  return {
    title,
    content,
    typeName,
    placeholderText,
    buildPayload
  }
}
