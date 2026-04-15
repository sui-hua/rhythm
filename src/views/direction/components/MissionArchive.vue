<!--
  任务归档面板 (MissionArchive.vue)
  展示当前选中月份有任务的日期列表，支持内联编辑任务标题、时间和时长。
-->
<template>
  <div class="archive-root">
    <ArchiveHeader
      :month-name="selectedMonth ? months[selectedMonth - 1].full : '无内容'"
      :task-count="datesWithTasks.length"
      :selected-month="selectedMonth"
    />

    <ScrollArea class="archive-scroll">
      <div v-if="datesWithTasks.length > 0" class="archive-list">
        <div class="archive-line"></div>

        <TransitionGroup name="task-list">
          <ArchiveItem
            v-for="day in datesWithTasks"
            :key="day"
            :day="day"
            :task="dailyTasks[dayTaskKey(day)]"
            :task-key="dayTaskKey(day)"
            @update-task="(task, payload) => handleUpdateTask(task, payload)"
          />
        </TransitionGroup>
      </div>

      <div v-else class="archive-empty">
        <p class="archive-empty-text">暂无归档内容，请先在下方日期面板中规划任务。</p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionTasks } from '@/views/direction/composables/useDirectionTasks'
import { ScrollArea } from '@/components/ui/scroll-area'
import ArchiveHeader from '@/views/direction/components/ArchiveHeader.vue'
import ArchiveItem from '@/views/direction/components/ArchiveItem.vue'

const { months } = useDirectionGoals()
const { selectedMonth, datesWithTasks, dailyTasks, dayTaskKey } = useDirectionSelection()
const { handleUpdateTask } = useDirectionTasks()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.archive-root {
  @apply flex-1 bg-white flex flex-col overflow-hidden;
}

.archive-scroll {
  @apply flex-1 px-6 md:px-10 py-6 pb-6;
}

.archive-list {
  @apply flex flex-col relative;
}

.archive-line {
  @apply absolute left-5 top-4 bottom-4 w-px bg-zinc-100;
}

.archive-empty {
  @apply h-64 flex flex-col items-center justify-center text-center p-6 border border-zinc-100 rounded-xl bg-zinc-50/30;
}

.archive-empty-text {
  @apply text-sm text-muted-foreground;
}

.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
