<script setup>
import { ref, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

const content = ref('')

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    content.value = newVal.content
  } else {
    content.value = ''
  }
}, { immediate: true })

const typeName = computed(() => {
  if (props.type === 'week') return '周'
  if (props.type === 'month') return '月'
  return '年'
})

const placeholderText = computed(() => {
  return `在这里写下您的${typeName.value}总结...`
})

const handleSubmit = () => {
  emit('save', {
    content: content.value
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {{ typeName }}总结内容
      </label>
      <Textarea
        v-model="content"
        :placeholder="placeholderText"
        class="min-h-[300px] text-base leading-relaxed resize-none"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <Button variant="outline" @click="$emit('cancel')">取消</Button>
      <Button @click="handleSubmit" class="bg-primary text-primary-foreground font-semibold px-8 whitespace-nowrap">
        保存总结
      </Button>
    </div>
  </div>
</template>
