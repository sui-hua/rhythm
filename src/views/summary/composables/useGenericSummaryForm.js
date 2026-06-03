import { computed, ref, watch } from 'vue'

export const useGenericSummaryForm = (initialDataRef, typeRef) => {
  const title = ref('')
  const content = ref('')

  // 监听初始数据变化，自动填充表单
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

  const typeName = computed(() => {
    if (typeRef.value === 'week') return '周'
    if (typeRef.value === 'month') return '月'
    return '年'
  })

  const placeholderText = computed(() => `在这里写下您的${typeName.value}总结...`)

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
