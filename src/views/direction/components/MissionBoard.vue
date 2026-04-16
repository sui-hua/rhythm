<template>
  <div class="board-root" @mouseup="endSelection">
    <TransitionGroup name="list">
      <MissionBoardMonth v-for="m in activeMonthRange" :key="m" :month="m" />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonth from '@/views/direction/components/MissionBoardMonth.vue'

const { activeMonthRange } = useDirectionGoals()
const { endSelection, selectedGoal } = useDirectionSelection()
const { loadMonthlyPlans } = useDirectionFetch()

watch(selectedGoal, async (newGoal) => {
  if (newGoal) {
    await loadMonthlyPlans(newGoal.plan_id)
  }
})
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
