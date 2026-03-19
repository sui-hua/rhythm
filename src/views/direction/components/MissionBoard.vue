<template>
  <div class="board-root" @mouseup="endSelection">
    <TransitionGroup name="list">
      <MissionBoardMonth v-for="m in activeMonthRange" :key="m" :month="m" />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonth from '@/views/direction/components/MissionBoardMonth.vue'

const { activeMonthRange } = useDirectionGoals()
const { endSelection } = useDirectionSelection()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.board-root {
  @apply pb-32 px-6;
}

@media (min-width: 768px) {
  .board-root {
    @apply px-10;
  }
}
</style>
