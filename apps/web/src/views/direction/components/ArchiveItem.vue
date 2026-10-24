<script lang="ts" setup>
/**
 * ArchiveItem — 单条归档任务编辑项
 *
 * 职责：展示某一天的任务，并提供标题、时间、时长的内联编辑能力。
 * 数据流：props.task → 本地草稿 → update-task 事件 → 父级更新缓存与数据库
 */

// ── 依赖导入 ──
import { computed, ref, watch } from 'vue'
import type { GoalDay, UpdateGoalDayPayload } from '@/services/db/goalDays'

// ── Props ──
// day: 当前归档日期；task: 对应的日计划；taskKey: 兼容父级列表 key
const props = defineProps<{
  day: number
  task?: GoalDay | null
  taskKey: string
}>()

// ── Emits ──
// update-task: 通知父级保存单个字段修改
const emit = defineEmits<{
  'update-task': [task: GoalDay, payload: UpdateGoalDayPayload]
}>()

// ── 状态 ──
// 标题草稿，避免父级重渲染时输入框回退到旧值
const titleDraft = ref('')
// 时间草稿，提交前保持在本地，不受外部重渲染影响
const timeDraft = ref('')
// 时长草稿，提交前保持在本地，不受外部重渲染影响
const durationDraft = ref('')

// ── 计算属性 ──
// 当前是否存在可编辑任务，统一给模板做空值保护
const hasTask = computed(() => !!props.task)

// ── 侦听器 ──
// 任务切换或服务端回填后，同步本地草稿，避免编辑中丢失当前显示值
watch(
  () => [props.task?.id, props.task?.title, props.task?.task_time, props.task?.duration] as const,
  () => {
    titleDraft.value = props.task?.title || ''
    timeDraft.value = props.task?.task_time ? props.task.task_time.slice(0, 5) : ''
    durationDraft.value = props.task?.duration != null ? String(props.task.duration) : ''
  },
  { immediate: true }
)

// ── 方法 ──
// 二元签名：handleUpdateTask(task, payload)
const handleUpdateTask = (task: GoalDay | null | undefined, payload: UpdateGoalDayPayload) => {
  if (!task) return
  emit('update-task', task, payload)
}

// 提交标题修改：仅在内容有变化时发送更新，减少无意义写库
const commitTitle = () => {
  if (!props.task) return
  const nextTitle = titleDraft.value.trim()
  if (nextTitle === props.task.title) return
  handleUpdateTask(props.task, { title: nextTitle })
}

// 提交时间修改：输入框为空时写回 null，保持数据库与界面一致
const commitTime = () => {
  if (!props.task) return
  const nextTime = timeDraft.value.trim()
  const normalized = nextTime || null
  if ((props.task.task_time || null) === normalized) return
  handleUpdateTask(props.task, { task_time: normalized })
}

// 提交时长修改：空值回退为 null，避免错误写入旧值
const commitDuration = () => {
  if (!props.task) return
  const raw = durationDraft.value.trim()
  const normalized = raw ? Number.parseInt(raw, 10) : null
  if ((props.task.duration ?? null) === normalized) return
  handleUpdateTask(props.task, { duration: normalized })
}
</script>

<template>
  <div class="pl-20 pb-6 last:pb-0 group/item">
    <div class="flex items-center gap-3 relative">
      <div class="absolute left-[-25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-white transition-colors z-10 group-hover/item:bg-primary"></div>
      <span class="text-xs font-bold font-mono text-muted-foreground/50 uppercase tracking-widest transition-colors w-10 text-right shrink-0 group-hover/item:text-primary">{{ String(day).padStart(2, '0') }}</span>

      <div v-if="hasTask && task" class="min-h-[50px] flex-1 rounded-xl border border-border bg-card p-3 text-sm font-medium tracking-tight leading-relaxed text-foreground shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group-hover/item:border-zinc-200">
        <input
          class="font-medium bg-transparent border-none outline-none w-full"
          v-model="titleDraft"
          @blur="commitTitle"
          @keyup.enter.prevent="commitTitle"
        />

        <div class="flex items-center gap-4 border-t border-zinc-50 pt-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时间</span>
            <input
              type="time"
              class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[60px]"
              v-model="timeDraft"
              @blur="commitTime"
              @keyup.enter.prevent="commitTime"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时长</span>
            <div class="flex items-center">
              <input
                type="number"
                class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[40px] text-right"
                v-model="durationDraft"
                @blur="commitDuration"
                @keyup.enter.prevent="commitDuration"
              />
              <span class="text-xs text-muted-foreground font-mono ml-1">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
