import { computed, ref, watch } from 'vue'

export const useGenericSummaryForm = (initialDataRef, typeRef) => {
  const title = ref('')
  const content = ref('')
  const mood = ref(null)

  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        const summaryContent = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content
          : {}

        title.value = newVal.title ?? ''
        content.value = summaryContent.text ?? (typeof newVal.content === 'string' ? newVal.content : '')
        mood.value = newVal.mood ?? summaryContent.mood ?? null
      } else {
        title.value = ''
        content.value = ''
        mood.value = null
      }
    },
    { immediate: true }
  )

  const typeName = computed(() => {
    if (typeRef.value === 'week') return '周'
    if (typeRef.value === 'month') return '月'
    if (typeRef.value === 'day') return '日'
    return '年'
  })

  const placeholderText = computed(() => `在这里写下您的${typeName.value}总结...`)

  const buildPayload = () => ({
    title: title.value.trim(),
    text: content.value,
    mood: mood.value ?? null
  })

  return {
    title,
    content,
    mood,
    typeName,
    placeholderText,
    buildPayload
  }
}
