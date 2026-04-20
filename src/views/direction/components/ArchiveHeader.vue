<script setup>
/**
 * 归档头部组件 (ArchiveHeader.vue)
 *
 * @description
 * 显示归档视图的顶部标题区域，包含：
 * - 左侧：模块标签"任务归档" + 月份完整名称（如"2025年1月"）
 * - 右侧：周期密度标签 + 有任务的天数统计（显示为 X / 31 的形式）
 *
 * 该组件属于 Direction 模块的归档功能，用于在月度归档视图中展示当前月份的
 * 基本信息和任务密度统计，帮助用户快速了解该月的任务完成情况。
 *
 * @props
 * @param {string} monthName - 月份完整名称，默认"无内容"
 * @param {number} taskCount - 有任务的天数（即周期密度分子），默认 0
 * @param {Array} months - 月份数据数组（用于下拉选择等），必填
 * @param {number|null} selectedMonth - 当前选中的月份索引，默认 null
 *
 * @example
 * <ArchiveHeader
 *   monthName="2025年1月"
 *   :taskCount="15"
 *   :months="monthList"
 *   :selectedMonth="0"
 * />
 */
defineProps({
  /**
   * 月份完整名称
   */
  monthName: {
    type: String,
    default: '无内容'
  },
  /**
   * 有任务的天数
   */
  taskCount: {
    type: Number,
    default: 0
  },
  /**
   * 月份数据
   */
  months: {
    type: Array,
    required: true
  },
  /**
   * 当前选中的月份
   */
  selectedMonth: {
    type: Number,
    default: null
  }
})
</script>

<template>
  <header class="archive-header">
    <div class="archive-header-left">
      <span class="archive-caption">任务归档</span>
      <h3 class="archive-title">{{ monthName }}</h3>
    </div>
    <div class="archive-header-right">
      <p class="archive-density-label">周期密度</p>
      <div class="archive-density-value">
        {{ taskCount }}
        <span class="archive-density-total">/ 31</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
@reference "@/assets/tw-theme.css";

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
</style>
