<!-- 单日格子组件，显示日期和任务小时指示器 -->
  <div
    class="bg-card p-2 sm:p-4 flex flex-col transition-all relative overflow-hidden flex-1 min-h-0"
    :class="day.isCurrent ? 'cursor-pointer group z-10' : 'bg-transparent cursor-default opacity-10'"
    @click="day.isCurrent && $emit('enterDay', day.date)"
  >
    <!-- Hover Bottom Border -->
    <div v-if="day.isCurrent" class="absolute bottom-0 left-0 right-0 h-0 bg-foreground transition-all duration-300 ease-out z-20 group-hover:h-1"></div>
    
    <!-- Foreground Content -->
    <div class="relative z-10 flex h-full items-start pointer-events-none">
      <div class="flex flex-col gap-1">
        <!-- Geometric Event Indicators -->
        <div v-if="day.isCurrent && day.tasks?.length" class="flex gap-0.5 h-1">
          <div 
            v-for="i in Math.min(day.tasks.length, 5)" 
            :key="i"
            class="w-1 h-1 bg-foreground/20 transition-colors duration-300 group-hover:bg-foreground"
          ></div>
          <div v-if="day.tasks.length > 5" class="w-1 h-1 border-b border-r border-foreground/20 rotate-45 transform -translate-y-0.5 ml-0.5 group-hover:border-foreground"></div>
        </div>
        
        <div class="flex items-baseline gap-1">
          <span
            class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none transition-colors duration-500"
            :class="day.isCurrent ? 'text-foreground' : 'text-zinc-300'"
          >
            {{ day.date }}
          </span>
        </div>
      </div>
    </div>

    <!-- Vertical Metric Ruler (Bauhaus Style) -->
    <div v-if="day.isCurrent" class="absolute right-0 top-0 bottom-0 w-6 sm:w-8 flex flex-col justify-between py-4 sm:py-6 z-10">
      <div
        v-for="h in 24"
        :key="h"
        class="h-px bg-zinc-100 transition-all duration-300 self-end"
        :class="day.taskHours?.includes(h) 
          ? 'w-4 sm:w-6 bg-foreground group-hover:w-5 sm:group-hover:w-7 group-hover:bg-foreground' 
          : 'w-1 sm:w-2 opacity-30 group-hover:opacity-100 group-hover:bg-zinc-300'"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  day: Object
})

defineEmits(['enterDay'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
