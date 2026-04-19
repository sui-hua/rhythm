<template>
  <div class="rounded-3xl border border-border bg-card p-4">
    <p class="text-sm font-semibold text-foreground">提醒设置</p>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      只有你主动打开提醒后，系统才会申请通知权限，并按设定时间提醒你。
    </p>
    <button
      class="mt-4 rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background"
      @click="$emit('enable')"
    >
      开启提醒
    </button>
  </div>
</template>

<script setup>
defineEmits(['enable'])
</script>
