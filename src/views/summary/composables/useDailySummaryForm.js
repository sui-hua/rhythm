import { ref, watch } from 'vue'

export const useDailySummaryForm = (initialDataRef) => {
  const formData = ref({
    done: '',
    improve: '',
    tomorrow: ''
  })

  watch(
    initialDataRef,
    (newVal) => {
      if (newVal && newVal.content) {
        try {
          formData.value = typeof newVal.content === 'string'
            ? JSON.parse(newVal.content)
            : { ...newVal.content }
        } catch (e) {
          console.error('Failed to parse summary content:', e)
          formData.value = { done: '', improve: '', tomorrow: '' }
        }
      } else {
        formData.value = { done: '', improve: '', tomorrow: '' }
      }
    },
    { immediate: true }
  )

  const buildPayload = () => ({
    content: { ...formData.value }
  })

  return {
    formData,
    buildPayload
  }
}
