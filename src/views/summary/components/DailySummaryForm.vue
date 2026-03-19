<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">今日成就</label>
      <Textarea
        v-model="formData.done"
        placeholder="今天完成了哪些重要事情？"
        class="min-h-[100px] text-base leading-relaxed resize-none"
      />
    </div>

    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">改进之处</label>
      <Textarea
        v-model="formData.improve"
        placeholder="有哪些地方可以做得更好？"
        class="min-h-[100px] text-base leading-relaxed resize-none"
      />
    </div>

    <div class="grid gap-2">
      <label class="text-sm font-medium leading-none">明日计划</label>
      <Textarea
        v-model="formData.tomorrow"
        placeholder="明天最优先处理的任务是什么？"
        class="min-h-[100px] text-base leading-relaxed resize-none"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <Button variant="outline" class="whitespace-nowrap" @click="$emit('cancel')">取消</Button>
      <Button class="bg-foreground text-background font-semibold px-8 whitespace-nowrap" @click="handleSubmit">
        保存今日总结
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useDailySummaryForm } from '@/views/summary/composables/useDailySummaryForm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toRef } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const { formData, buildPayload } = useDailySummaryForm(toRef(props, 'initialData'))

const handleSubmit = () => {
  emit('save', buildPayload())
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
