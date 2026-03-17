<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">
        {{ typeName }}总结内容
      </label>
      <Textarea
        v-model="content"
        :placeholder="placeholderText"
        class="min-h-[300px] text-base leading-relaxed resize-none"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <Button variant="outline" class="whitespace-nowrap" @click="$emit('cancel')">取消</Button>
      <Button class="bg-foreground text-background font-semibold px-8 whitespace-nowrap" @click="handleSubmit">
        保存总结
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useGenericSummaryForm } from '@/views/summary/composables/useGenericSummaryForm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toRef } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  type: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])

const { content, typeName, placeholderText, buildPayload } = useGenericSummaryForm(
  toRef(props, 'initialData'),
  toRef(props, 'type')
)

const handleSubmit = () => {
  emit('save', buildPayload())
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
@reference "tailwindcss/utilities";
</style>
