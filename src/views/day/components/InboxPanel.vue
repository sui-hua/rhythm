<template>
  <section class="rounded-3xl border border-border bg-card p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">待安排</h3>
      <span class="text-xs text-muted-foreground">{{ items.length }} 项</span>
    </div>
    <button
      v-for="item in items"
      :key="item.id"
      class="mt-3 block w-full rounded-2xl bg-secondary px-3 py-3 text-left text-sm"
      @click="$emit('schedule', item)"
    >
      {{ item.title }}
    </button>
</template>

<script setup>
/**
 * InboxPanel.vue - 待办事项收件箱面板
 * 
 * @description 
 *   用于展示当前用户尚未安排到具体时间线的待办事项（Inbox/收集箱）。
 *   常见使用场景：用户收集的想法、任务或灵感，在没有明确执行时间时，
 *   先暂存在此面板，后续通过点击某一项将其安排到具体的时间点。
 * 
 * @props
 *   - items: Array - 待安排的事项列表，每项应包含 id 和 title 字段
 *     默认值为空数组 []
 * 
 * @emits
 *   - schedule: (item) => void - 当用户点击某一项时触发，
 *     通知父组件将此项安排到具体时间轴/日程中
 * 
 * @usage
 *   <InboxPanel 
 *     :items="inboxItems" 
 *     @schedule="handleSchedule" 
 *   />
 * 
 * @see
 *   - 父组件通常位于 src/views/day/ 目录，负责管理日视图的时间轴
 *   - 被安排的事项会从 inbox 中移除并添加到具体的时间点
 */
defineProps({
  // 待安排的事项列表，格式为 { id: string|number, title: string }[]
  items: { type: Array, default: () => [] }
})

// 通知父组件用户希望将某事项安排到时间轴
defineEmits(['schedule'])
</script>
