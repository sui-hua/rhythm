<template>
  <div class="archive-root">
    <header class="archive-header">
      <div class="archive-header-left">
        <span class="archive-caption">任务归档</span>
        <h3 class="archive-title">{{ selectedMonth ? months[selectedMonth - 1].full : '无内容' }}</h3>
      </div>
      <div class="archive-header-right">
        <p class="archive-density-label">周期密度</p>
        <div class="archive-density-value">
          {{ datesWithTasks.length }}
          <span class="archive-density-total">/ 31</span>
        </div>
      </div>
    </header>

    <ScrollArea class="archive-scroll">
      <div v-if="datesWithTasks.length > 0" class="archive-list">
        <div class="archive-line"></div>

        <TransitionGroup name="task-list">
          <div v-for="day in datesWithTasks" :key="day" class="archive-item">
            <div class="archive-item-row">
              <div class="archive-dot"></div>
              <span class="archive-day">{{ String(day).padStart(2, '0') }}</span>

              <div v-if="dailyTasks[dayTaskKey(day)]" class="archive-card">
                <input
                  class="archive-input"
                  :value="dailyTasks[dayTaskKey(day)].title"
                  @blur="(e) => handleUpdateTask({ ...dailyTasks[dayTaskKey(day)], title: e.target.value })"
                  @keyup.enter="(e) => e.target.blur()"
                />

                <div class="archive-meta">
                  <div class="archive-meta-item">
                    <span class="archive-meta-label">时间</span>
                    <input
                      type="time"
                      class="archive-time-input"
                      :value="dailyTasks[dayTaskKey(day)].task_time ? dailyTasks[dayTaskKey(day)].task_time.slice(0, 5) : ''"
                      @blur="(e) => handleUpdateTask({ ...dailyTasks[dayTaskKey(day)], task_time: e.target.value || null })"
                      @keyup.enter="(e) => e.target.blur()"
                    />
                  </div>
                  <div class="archive-meta-item">
                    <span class="archive-meta-label">时长</span>
                    <div class="archive-duration">
                      <input
                        type="number"
                        class="archive-duration-input"
                        :value="dailyTasks[dayTaskKey(day)].duration"
                        @blur="(e) => handleUpdateTask({ ...dailyTasks[dayTaskKey(day)], duration: e.target.value ? parseInt(e.target.value) : null })"
                        @keyup.enter="(e) => e.target.blur()"
                      />
                      <span class="archive-duration-unit">m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

const { months } = useDirectionGoals()
const { selectedMonth, datesWithTasks, dailyTasks, dayTaskKey } = useDirectionSelection()
const { handleUpdateTask } = useDirectionTasks()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.archive-root {
  @apply flex-1 bg-white flex flex-col overflow-hidden;
}

.archive-header {
  @apply p-6 md:p-10 border-b flex justify-between items-end;
}

.archive-header-left {
  @apply flex flex-col gap-1;
}

.archive-caption {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 block;
}

.archive-title {
  @apply text-3xl font-bold tracking-tight text-foreground leading-none;
}

.archive-header-right {
  @apply text-right flex flex-col items-end gap-1;
}

.archive-density-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-widest;
}

.archive-density-value {
  @apply text-lg font-bold tracking-tight;
}

.archive-density-total {
  @apply text-xs text-muted-foreground font-medium ml-0.5;
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

.archive-item {
  @apply pl-10 pb-6 last:pb-0;
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

.archive-empty {
  @apply h-64 flex flex-col items-center justify-center text-center p-6 border border-zinc-100 rounded-xl bg-zinc-50/30;
}

.archive-empty-text {
  @apply text-sm text-muted-foreground;
}

.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
