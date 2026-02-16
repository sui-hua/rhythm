<template>
  <header class="p-6 md:p-10 flex flex-col gap-6">
      <div class="flex flex-col gap-1">
      <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">当前关注</span>
      <h2 class="text-3xl font-bold tracking-tight">{{ selectedGoalName }}</h2>
    </div>

    <Card class="border shadow-sm rounded-xl overflow-hidden bg-background">
      <CardContent class="p-6 flex flex-col">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">执行时轴</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold tracking-tight">{{ months[startMonth-1].label }}</span>
              <span class="text-xs text-muted-foreground font-medium">到</span>
              <span class="text-2xl font-bold tracking-tight">{{ months[endMonth-1].label }}</span>
            </div>
          </div>
          <div class="flex bg-secondary p-1 rounded-lg border">
            <button 
              @click="emit('update:activePicker', 'start')" 
              class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0"
              :class="activePicker === 'start' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >开始月份</button>
            <button 
              @click="emit('update:activePicker', 'end')" 
              class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0"
              :class="activePicker === 'end' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >结束月份</button>
          </div>
        </div>

        <div class="relative px-2 py-4 mt-8">
          <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-secondary rounded-full"></div>
          <!-- 
             [面试点] 动态进度条计算
             这里没有使用任何第三方库，纯手写的逻辑。
             原理：一年12个月，把总宽度分成 11 份（因为是从第1个月到第12个月，中间有11个间隔）。
             left: (startMonth - 1) / 11 * 100% -> 起点位置
             width: (endMonth - startMonth) / 11 * 100% -> 跨度宽度
             CSS 的 transition-all duration-700 提供了丝滑的动画效果。
          -->
          <div class="absolute top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 rounded-full"
            :style="{ left: `${((localStart - 1) / 11) * 100}%`, width: `${((localEnd - localStart) / 11) * 100}%` }">
          </div>
          <div class="relative flex justify-between">
            <div v-for="m in 12" :key="m" @click="selectMonth(m)" class="flex flex-col items-center group cursor-pointer">
              <span class="text-[10px] font-mono font-bold mb-4 transition-all" :class="isWithinRange(m) || isMonthActive(m) ? 'text-foreground' : 'text-muted-foreground/30 group-hover:text-muted-foreground'">{{ String(m).padStart(2, '0') }}</span>
              <div class="w-4 h-4 rounded-full flex items-center justify-center z-10 transition-all" :class="isMonthActive(m) ? 'bg-primary scale-125' : 'bg-background border'">
                <div class="w-1.5 h-1.5 rounded-full" :class="isMonthActive(m) ? 'bg-primary-foreground' : isWithinRange(m) ? 'bg-primary/50' : 'bg-muted group-hover:bg-muted-foreground/50'"></div>
              </div>
            </div>
          </div>

          
          <!-- 确认修改按钮 -->
          <Transition name="bounce-up">
            <div v-if="hasChanges" class="mt-8">
               <button 
                class="w-full inline-flex items-center justify-center gap-2 rounded-full py-2 text-xs font-bold tracking-wide bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 ring-2 ring-background"
                @click="handleConfirm"
               >
                 <span>确认修改</span>
                 <Check class="w-3.5 h-3.5 opacity-70" :stroke-width="3" />
               </button>
            </div>
          </Transition>
        </div>
      </CardContent>
    </Card>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-vue-next'

const props = defineProps({
  // 当前选中的目标对象
  selectedGoal: {
    type: Object,
    default: () => ({ name: '', startMonth: 1, endMonth: 1 })
  },
  // 月份数据常量
  months: {
    type: Array,
    required: true
  },
  // 当前激活的选择器类型 ('start' 或 'end')
  activePicker: {
    type: String,
    default: 'start'
  }
})

const emit = defineEmits(['update:activePicker', 'update-range'])

// 计算属性：安全获取开始/结束月份及目标名称
const startMonth = computed(() => props.selectedGoal?.startMonth ?? 1)
const endMonth = computed(() => props.selectedGoal?.endMonth ?? 1)
const selectedGoalName = computed(() => props.selectedGoal?.name ?? '')

// 判断月份是否处于激活状态（起点或终点）
const isMonthActive = (m) => localStart.value === m || localEnd.value === m
// 判断月份是否在范围内
const isWithinRange = (m) => m >= localStart.value && m <= localEnd.value

// 本地状态
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'

const localStart = ref(1)
const localEnd = ref(1)

// 初始化
watch(() => props.selectedGoal, (val) => {
  if (val) {
    localStart.value = val.startMonth
    localEnd.value = val.endMonth
  }
}, { immediate: true, deep: true })

const hasChanges = computed(() => {
  if (!props.selectedGoal) return false
  return localStart.value !== props.selectedGoal.startMonth || localEnd.value !== props.selectedGoal.endMonth
})

const selectMonth = (m) => {
  if (props.activePicker === 'start') {
     if (m > localEnd.value) localEnd.value = m
     localStart.value = m
     emit('update:activePicker', 'end')
  } else {
     if (m < localStart.value) localStart.value = m
     localEnd.value = m
     emit('update:activePicker', 'start')
  }
}

const handleConfirm = () => {
  emit('confirm-range', { start: localStart.value, end: localEnd.value })
}
</script>

<style scoped>
/* 确认按钮的弹跳动画 */
.bounce-up-enter-active {
  animation: bounce-up-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bounce-up-leave-active {
  transition: all 0.3s ease-in;
}
.bounce-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@keyframes bounce-up-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(-8px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
</style>
