<!--
  Checkbox 组件 - 圆形复选框
  Props: defaultChecked, modelValue, disabled 等，支持 v-model 双向绑定
-->
<script setup lang="ts">
import type { HTMLAttributes, computed } from 'vue'
import type { CheckboxRootEmits, CheckboxRootProps } from 'radix-vue'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer h-6 w-6 shrink-0 rounded-full border border-zinc-200 ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white hover:border-zinc-400 group',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current animate-in zoom-in-50 duration-200">
      <slot>
        <Check class="h-3.5 w-3.5 stroke-[4]" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
