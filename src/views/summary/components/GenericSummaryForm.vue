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

<!--
/**
 * GenericSummaryForm.vue - 通用总结表单组件
 *
 * @description
 * 提供统一的周/月/年总结编辑界面，包含标题、内容两个字段。
 * 该组件是一个纯展示层组件，核心业务逻辑通过 useGenericSummaryForm composable 处理。
 *
 * @props
 * - initialData: Object  - 初始数据（编辑模式时传入，包含 id, title, content 等）
 * - type: String         - 总结类型，用于区分 'week' | 'month' | 'year'
 *
 * @emits
 * - save:    提交表单时触发，携带 buildPayload() 构建的 payload 对象
 * - cancel:  点击取消按钮时触发
 * - delete:  点击删除按钮时触发（仅在编辑模式 initialData?.id 存在时显示）
 *
 * @usage
 * <GenericSummaryForm
 *   :initial-data="someSummaryData"
 *   type="week"
 *   @save="handleSave"
 *   @cancel="handleCancel"
 *   @delete="handleDelete"
 * />
 *
 * @see useGenericSummaryForm - 核心逻辑 composable
 */
-->
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

const emit = defineEmits(['save', 'cancel', 'delete'])

const { title, content, typeName, placeholderText, buildPayload } = useGenericSummaryForm(
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
