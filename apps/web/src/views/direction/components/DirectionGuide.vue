<!-- 所向模块新手引导弹窗：首次进入时展示目标→月计划→日任务三级结构说明 -->
<template>
  <Teleport to="body">
    <!-- 遮罩层 + 居中容器 -->
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <!-- 引导卡片 -->
      <div class="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl p-8">
        <!-- 标题 -->
        <h2 class="text-2xl font-bold mb-4">欢迎使用所向模块</h2>

        <!-- 说明内容 -->
        <div class="space-y-4 text-sm text-muted-foreground">
          <p>所向模块帮助你将长期目标分解为可执行的每日任务：</p>

          <!-- 三级结构说明 -->
          <div class="space-y-2">
            <!-- 第一级：目标 -->
            <div class="flex items-start gap-3">
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <p><strong class="text-foreground">目标</strong> — 定义你的长期方向（如"健身"、"学习"）</p>
            </div>
            <!-- 第二级：月计划 -->
            <div class="flex items-start gap-3">
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <p><strong class="text-foreground">月计划</strong> — 将目标分解为月度里程碑</p>
            </div>
            <!-- 第三级：日任务 -->
            <div class="flex items-start gap-3">
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <p><strong class="text-foreground">日任务</strong> — 在日历上拖选分配每日执行任务</p>
            </div>
          </div>

          <!-- 联动提示 -->
          <p class="text-xs text-muted-foreground/70 mt-4">提示：所向中的日任务会自动出现在"时序"时间轴中</p>
        </div>

        <!-- 确认按钮 -->
        <Button class="w-full mt-6 h-10" @click="$emit('complete')">开始使用</Button>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'

// 控制引导弹窗是否显示
defineProps({ show: Boolean })
// 用户点击"开始使用"后触发
defineEmits(['complete'])
</script>
