import { computed, ref, watch } from 'vue'

export const useGenericSummaryForm = (initialDataRef, typeRef) => {
  const content = ref('')

  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        content.value = newVal.content
      } else {
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
    content: content.value
  })

  return {
    content,
    typeName,
    placeholderText,
    buildPayload
  }
}
