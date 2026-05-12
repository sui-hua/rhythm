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
          保存今日总结
        </Button>
      </div>
    </div>
  </div>
</template>

/**
 * DailySummaryForm.vue - 每日总结表单组件
 * 
 * 功能说明：
 *   提供每日工作/生活总结的录入表单，包含三个核心字段：
 *   - 今日成就（done）：记录当天完成的重要事项
 *   - 改进之处（improve）：反思可以优化的地方
 *   - 明日计划（tomorrow）：规划次日优先任务
 * 
 * 组件特性：
 *   - 支持新建和编辑两种模式，通过 initialData 判断
 *   - 编辑模式显示删除按钮，可删除已存在的总结记录
 *   - 表单数据通过 useDailySummaryForm composable 统一管理
 *   - 提交时自动构建 payload 并通过 'save' 事件传递给父组件
 * 
 * Props：
 *   - initialData: Object|null - 可选，传入已有数据时为编辑模式
 * 
 * Emits：
 *   - save: 提交表单时触发，传递构建好的总结数据对象
 *   - cancel: 点击取消按钮时触发
 *   - delete: 点击删除按钮时触发（仅编辑模式）
 * 
 * 依赖组件：
 *   - Textarea: 多行文本输入（成就/改进/计划）
 *   - Button: 操作按钮
 */

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

const emit = defineEmits(['save', 'cancel', 'delete'])

const { formData, buildPayload } = useDailySummaryForm(toRef(props, 'initialData'))

const handleSubmit = () => {
  emit('save', buildPayload())
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
