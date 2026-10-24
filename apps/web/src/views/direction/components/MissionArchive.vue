<template>
  <!--
    MissionArchive — 使命归档面板
    主要结构：归档头部（月份名称与任务数）、归档任务列表、空状态提示
  -->
  <div class="flex-1 bg-card flex flex-col overflow-hidden">
    <!-- 归档头部开始 -->
    <ArchiveHeader
      :month-name="selectedMonth ? months[selectedMonth - 1]?.full : '无内容'"
      :task-count="datesWithTasks.length"
      :selected-month="selectedMonth ?? undefined"
      :months="months"
    />
    <!-- 归档头部结束 -->

    <!-- 归档任务列表开始 -->
    <ScrollArea class="flex-1 px-6 md:px-10 py-6 pb-6">
      <div v-if="datesWithTasks.length > 0" class="flex flex-col relative">
        <!-- 时间轴竖线，视觉连接各日期节点 -->
        <div class="absolute left-5 top-4 bottom-4 w-px bg-zinc-100"></div>

        <!-- 归档任务项列表，带入场动画 -->
        <TransitionGroup name="task-list">
          <ArchiveItem
            v-for="day in datesWithTasks"
            :key="day"
            :day="day"
            :task="dailyTasks[dayTaskKey(day)] ?? null"
            :task-key="dayTaskKey(day)"
            @update-task="handleUpdateTask"
          />
        </TransitionGroup>
      </div>

      <!-- 空状态提示，引导用户先在日期面板中规划任务 -->
      <div v-else class="h-64 flex flex-col items-center justify-center text-center p-6 border border-border rounded-xl bg-zinc-50/30">
        <p class="text-sm text-muted-foreground">暂无归档内容，请先在下方日期面板中规划任务。</p>
      </div>
    </ScrollArea>
    <!-- 归档任务列表结束 -->
  </div>
</template>

<script lang="ts" setup>
/**
 * MissionArchive — 使命归档面板
 * 职责：展示选中月份下已有任务的日期列表，支持任务状态更新
 * 数据流：useDirectionSelection → datesWithTasks/dailyTasks → ArchiveItem（子组件）
 */

// ── 依赖导入 ──
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionTasks } from '@/views/direction/composables/useDirectionTasks'
import { ScrollArea } from '@/components/ui/scroll-area'
import ArchiveHeader from '@/views/direction/components/ArchiveHeader.vue'
import ArchiveItem from '@/views/direction/components/ArchiveItem.vue'

// ── Composables ──
// 获取月份配置列表，用于头部显示月份全名
const { months } = useDirectionGoals()
// selectedMonth: 当前选中月份 | datesWithTasks: 有任务的日期集合 | dailyTasks: 每日任务数据 | dayTaskKey: 日期→缓存键映射
const { selectedMonth, datesWithTasks, dailyTasks, dayTaskKey } = useDirectionSelection()
// 处理任务状态更新，同步到后端
const { handleUpdateTask } = useDirectionTasks()
</script>

<style scoped>
.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
