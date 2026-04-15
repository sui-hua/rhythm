<!-- SelectValue.vue - 选择器显示选中值组件 -->
<!--
  SelectValue 组件 - 选择器显示选中值
-->
<script setup lang="ts">
import type { SelectValueProps } from "reka-ui"
import { SelectValue } from "reka-ui"

const props = defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue v-bind="props">
    <slot />
  </SelectValue>
</template>
