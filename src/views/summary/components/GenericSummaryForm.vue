<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">
        {{ typeName }}总结标题
      </label>
      <Input
        v-model="title"
        type="text"
        placeholder="输入标题（可选）"
        class="h-10"
      />
    </div>

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

    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">
        {{ typeName }}心情
      </label>
      <Input
        v-model.number="mood"
        type="number"
        min="1"
        max="5"
        placeholder="1 到 5"
        class="h-10"
      />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 pt-4">
      <Button
        v-if="initialData?.id"
        variant="destructive"
        class="whitespace-nowrap"
        @click="$emit('delete')"
      >
        删除总结
      </Button>

      <div class="flex flex-wrap items-center gap-3 sm:ml-auto">
        <Button variant="outline" class="whitespace-nowrap" @click="$emit('cancel')">取消</Button>
        <Button class="bg-foreground text-background font-semibold px-8 whitespace-nowrap" @click="handleSubmit">
          保存总结
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGenericSummaryForm } from '@/views/summary/composables/useGenericSummaryForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const emit = defineEmits(['save', 'cancel', 'delete'])

const { title, content, mood, typeName, placeholderText, buildPayload } = useGenericSummaryForm(
  toRef(props, 'initialData'),
  toRef(props, 'type')
)

const handleSubmit = () => {
  emit('save', buildPayload())
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
