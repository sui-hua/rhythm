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
      if (newVal) {
        const content = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content
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

  const buildPayload = () => ({
    ...formData.value
  })

  return {
    formData,
    buildPayload
  }
}
