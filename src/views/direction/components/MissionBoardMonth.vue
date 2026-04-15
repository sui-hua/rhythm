<template>
  <Card class="month-card" :class="{ 'is-active': selectedMonth === month }">
    <MissionBoardMonthHeader :month="month" />
    <MissionBoardMonthBody v-if="selectedMonth === month" :month="month" />
  </Card>
</template>

<script setup>
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonthHeader from '@/views/direction/components/MissionBoardMonthHeader.vue'
import MissionBoardMonthBody from '@/views/direction/components/MissionBoardMonthBody.vue'
import { Card } from '@/components/ui/card'

const { month } = defineProps({
  month: {
    type: Number,
    required: true
  }
})

const { selectedMonth } = useDirectionSelection()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.month-card {
  @apply mb-4 rounded-xl transition-all duration-300 overflow-hidden border shadow-sm hover:bg-accent/30;
}

.month-card.is-active {
  @apply ring-1 ring-primary;
}
</style>
