<template>
  <div class="flex flex-col gap-6">
    <!-- 今日数据概览卡片开始 -->
    <div v-if="dataOverview" class="rounded-lg border bg-muted/30 p-4">
      <div class="text-sm font-medium mb-3">今日数据概览</div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="flex flex-col items-center gap-1">
          <span class="text-2xl font-bold text-primary">{{ dataOverview.completedTaskCount }}/{{ dataOverview.totalTaskCount }}</span>
          <span class="text-xs text-muted-foreground">任务完成</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <span class="text-2xl font-bold text-primary">{{ dataOverview.completionRate }}%</span>
          <span class="text-xs text-muted-foreground">完成率</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <span class="text-2xl font-bold text-primary">{{ dataOverview.habitLogCount }}</span>
          <span class="text-xs text-muted-foreground">习惯打卡</span>
        </div>
      </div>
      <div v-if="dataOverview.completedTaskTitles.length" class="mt-3 pt-3 border-t">
        <div class="text-xs text-muted-foreground mb-2">已完成任务：</div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="title in dataOverview.completedTaskTitles"
            :key="title"
            class="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            {{ title }}
          </span>
        </div>
      </div>
    </div>
    <!-- 今日数据概览卡片结束 -->

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

<script setup>
import { useDailySummaryForm } from '@/views/summary/composables/useDailySummaryForm'
import { fetchTodayDataOverview } from '@/views/summary/composables/useSummaryPrefill'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toRef, ref, onMounted } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel', 'delete'])

const { formData, buildPayload } = useDailySummaryForm(toRef(props, 'initialData'))

// 今日数据概览，加载失败不影响表单使用
const dataOverview = ref(null)

onMounted(async () => {
  try {
    dataOverview.value = await fetchTodayDataOverview()
  } catch (e) {
    console.warn('加载今日数据概览失败:', e)
  }
})

const handleSubmit = () => {
  emit('save', buildPayload())
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
