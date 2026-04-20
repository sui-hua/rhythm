<script setup>
/**
 * 归档项组件 (ArchiveItem.vue)
 * 
 * 功能说明：
 * - 在归档时间线中显示单个日期的任务条目
 * - 支持内联编辑任务标题、时间和时长
 * - 配合 ArchiveSidebar 使用，展示日视图下的归档数据
 * 
 * 视觉特点：
 * - 左侧时间轴圆点 + 日期标签
 * - 右侧任务卡片显示任务详情
 * - 悬停时圆点和日期高亮为主色调
 * 
 * @props {number} day - 日期数字（1-31）
 * @props {Object|null} task - 任务数据对象，包含 title、task_time、duration 字段
 * @props {string} taskKey - 日期任务键名，用于数据关联
 * @emits {update-task} - 任务内容更新时触发，传递 (task, payload) 二元签名
 */

/**
 * 定义组件接收的 props
 * - day: 日期数字（1-31），用于显示在时间轴左侧
 * - task: 任务数据对象，支持 null（无任务时只显示日期）
 * - taskKey: 日期任务键名，用于数据关联和更新定位
 */
defineProps({
  /**
   * 日期数字，如 1、15、31
   */
  day: {
    type: Number,
    required: true
  },
  /**
   * 任务数据对象，结构: { title: string, task_time: string|null, duration: number|null }
   * 当为 null 时组件仅显示日期，不渲染任务卡片
   */
  task: {
    type: Object,
    default: null
  },
  /**
   * 日期任务键名，格式通常为 "YYYY-MM-DD"，用于数据关联
   */
  taskKey: {
    type: String,
    required: true
  }
})

/**
 * 定义组件可触发的事件
 * @see update-task 用于向上层组件传递任务更新请求
 */
const emit = defineEmits(['update-task'])

/**
 * 处理任务内容更新的回调函数
 * 将子组件（input）的变更事件转换为向上层组件的 emit 调用
 * 
 * @param {Object} task - 被更新的任务对象（原始引用）
 * @param {Object} payload - 包含更新字段的对象，如 { title: '新标题' }
 */
const handleUpdateTask = (task, payload) => {
  emit('update-task', task, payload)
}
</script>

<template>
  <div class="archive-item">
    <div class="archive-item-row">
      <div class="archive-dot"></div>
      <span class="archive-day">{{ String(day).padStart(2, '0') }}</span>

      <div v-if="task" class="archive-card">
        <input
          class="archive-input"
          :value="task.title"
          @change="(e) => handleUpdateTask(task, { title: e.target.value })"
        />

        <div class="archive-meta">
          <div class="archive-meta-item">
            <span class="archive-meta-label">时间</span>
            <input
              type="time"
              class="archive-time-input"
              :value="task.task_time ? task.task_time.slice(0, 5) : ''"
              @change="(e) => handleUpdateTask(task, { task_time: e.target.value || null })"
            />
          </div>
          <div class="archive-meta-item">
            <span class="archive-meta-label">时长</span>
            <div class="archive-duration">
              <input
                type="number"
                class="archive-duration-input"
                :value="task.duration"
                @change="(e) => handleUpdateTask(task, { duration: e.target.value ? parseInt(e.target.value) : null })"
              />
              <span class="archive-duration-unit">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/tw-theme.css";

.archive-item {
  @apply pl-20 pb-6 last:pb-0;
}

.archive-item-row {
  @apply flex items-center gap-3 relative;
}

.archive-dot {
  @apply absolute left-[-25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-white transition-colors z-10;
}

.archive-day {
  @apply text-xs font-bold font-mono text-muted-foreground/50 uppercase tracking-widest transition-colors w-10 text-right shrink-0;
}

.archive-card {
  @apply min-h-[50px] flex-1 rounded-xl border border-zinc-100 bg-white p-3 text-sm font-medium tracking-tight leading-relaxed text-foreground shadow-sm hover:shadow-md transition-all flex flex-col gap-2;
}

.archive-item:hover .archive-dot {
  @apply bg-primary;
}

.archive-item:hover .archive-day {
  @apply text-primary;
}

.archive-item:hover .archive-card {
  @apply border-zinc-200;
}

.archive-input {
  @apply font-medium bg-transparent border-none outline-none w-full;
}

.archive-meta {
  @apply flex items-center gap-4 border-t border-zinc-50 pt-2;
}

.archive-meta-item {
  @apply flex items-center gap-2;
}

.archive-meta-label {
  @apply text-[10px] text-muted-foreground uppercase tracking-wider font-bold;
}

.archive-time-input {
  @apply text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[60px];
}

.archive-duration {
  @apply flex items-center;
}

.archive-duration-input {
  @apply text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[40px] text-right;
}

.archive-duration-unit {
  @apply text-xs text-muted-foreground font-mono ml-1;
}
</style>
