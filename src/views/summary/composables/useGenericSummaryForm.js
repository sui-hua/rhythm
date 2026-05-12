/**
 * @file useGenericSummaryForm.js
 * @description 通用总结表单 Composable，提供总结的标题、内容的响应式管理。
 *              支持周/月/年三种总结类型，自动解析不同数据格式并生成对应的表单占位文本。
 * @module views/summary/composables
 */

import { computed, ref, watch } from 'vue'

/**
 * 通用总结表单 Composable
 * 
 * @description 管理总结表单的状态（标题、内容），响应 initialDataRef 的变化自动填充表单，
 *              并根据 typeRef 提供对应的中文类型名称和占位文本。提供 buildPayload 方法用于构建提交数据。
 * 
 * @param {import('vue').Ref<object|null>} initialDataRef - 初始数据引用，当传入新数据时自动填充表单
 * @param {import('vue').Ref<string>} typeRef - 总结类型引用，支持 'week' | 'month' | 'year'
 * @returns {object} 包含响应式状态和计算属性的对象
 * @returns {import('vue').Ref<string>} returns.title - 总结标题
 * @returns {import('vue').Ref<string>} returns.content - 总结内容
 * @returns {import('vue').ComputedRef<string>} returns.typeName - 总结类型的中文名称（周/月/年）
 * @returns {import('vue').ComputedRef<string>} returns.placeholderText - 表单占位提示文本
 * @returns {function(): {title: string, text: string}} returns.buildPayload - 构建提交数据结构
 * 
 * @example
 * const initialDataRef = ref({ title: '本周总结', content: { text: '做了很多事' } })
 * const typeRef = ref('week')
 * const { title, content, typeName, placeholderText, buildPayload } = useGenericSummaryForm(initialDataRef, typeRef)
 */
export const useGenericSummaryForm = (initialDataRef, typeRef) => {
  /** @type {import('vue').Ref<string>} 总结标题 */
  const title = ref('')
  /** @type {import('vue').Ref<string>} 总结内容文本 */
  const content = ref('')

  /**
   * 监听 initialDataRef 变化，自动填充表单数据
   * 
   * 数据兼容处理：
   * - content 为对象且非数组时，取其 text 字段
   * - content 为字符串时直接作为文本内容
   * @param {object|null} newVal - 新的初始数据
   */
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        // 解析 content 结构：支持对象 { text } 格式或直接字符串
        const summaryContent = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content
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

  /**
   * 根据 typeRef 计算对应的中文类型名称
   * @returns {string} 周/月/年
   */
  const typeName = computed(() => {
    if (typeRef.value === 'week') return '周'
    if (typeRef.value === 'month') return '月'
    return '年'
  })

  /**
   * 动态生成表单占位文本
   * @returns {string} 如 "在这里写下您的周总结..."
   */
  const placeholderText = computed(() => `在这里写下您的${typeName.value}总结...`)

  /**
   * 构建提交用的数据载荷
   * @returns {{title: string, text: string}} 整理后的数据结构
   */
  const buildPayload = () => ({
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
