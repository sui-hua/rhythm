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

# MissionArchive.vue
# ====================
# 任务归档视图组件
#
# 功能说明：
# - 展示指定月份的每日任务归档列表（从 useDirectionSelection 获取）
# - 使用时间线样式呈现，左侧有连接线，任务项带入场动画
# - 支持任务更新操作（emit 给父组件处理）
# - 空状态友好提示
#
# 数据来源：
# - months/月份名称：useDirectionGoals 提供十二月份中英文名称
# - selectedMonth/datesWithTasks/dailyTasks/dayTaskKey：useDirectionSelection 管理月份选择和每日任务映射
# - handleUpdateTask：useDirectionTasks 处理任务更新逻辑
#
# 组件结构：
#   ArchiveHeader - 顶部月份标题栏，显示"月份名称 + 任务数量"
#   ScrollArea - 滚动容器（可容纳大量任务项）
#     archive-list - 任务列表容器（相对定位，包含左侧连接线）
#       ArchiveItem - 单日任务卡片，响应 update-task 事件
#     archive-empty - 无任务时的空状态占位
#
# 动画说明：
# - TransitionGroup 实现任务列表的顺序入场动画（translateX 从右侧滑入）
# - cubic-bezier(0.16, 1, 0.3, 1) 模拟弹性减速效果
#
# 样式说明：
# - archive-line：绝对定位的左侧垂直连接线（模拟时间线轨迹）
# - archive-root：Flex 容器，撑满父级高度，用于 direction 布局

<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionTasks } from '@/views/direction/composables/useDirectionTasks'
import { ScrollArea } from '@/components/ui/scroll-area'
import ArchiveHeader from '@/views/direction/components/ArchiveHeader.vue'
import ArchiveItem from '@/views/direction/components/ArchiveItem.vue'

// 从目标管理 composable 获取月份名称数组（1-12月中英文全称）
const { months } = useDirectionGoals()

// 从选择状态 composable 获取：
// - selectedMonth: 当前选中的月份编号（1-12）
// - datesWithTasks: 当月有任务的日期数组（按日期升序排列）
// - dailyTasks: 日期→任务映射表（key 格式为 YYYY-MM-DD）
// - dayTaskKey: 日期转字符串 key 的工具函数
const { selectedMonth, datesWithTasks, dailyTasks, dayTaskKey } = useDirectionSelection()

// 从任务操作 composable 获取任务更新处理函数
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
