# 移动端 UI 层级修复实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复移动端 UI 层级冲突和侧边栏左滑完成区域显示异常

**Architecture:** 三个组件共 3 处代码修改，均为 z-index 值调整或条件渲染添加，不涉及架构变更。

**Tech Stack:** Vue 3, Tailwind CSS 4

---

## 文件变更总览

| 文件 | 修改类型 |
|------|---------|
| `src/views/day/components/QuickAddDrawer.vue` | z-index 修改 |
| `src/views/day/components/MobileAddEventDrawer.vue` | z-index 修改 |
| `src/views/day/components/Sidebar.vue` | v-if 条件添加 |

---

## 任务 1: 修改 QuickAddDrawer.vue 层级

**Files:**
- Modify: `src/views/day/components/QuickAddDrawer.vue:12`

- [ ] **Step 1: 修改 QuickAddDrawer 的 z-index**

将第 12 行的 `z-101` 修改为 `z-[250]`：

```vue
<!-- 修改前 -->
<div
  class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 ..."

<!-- 修改后 -->
<div
  class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 ...
```

- [ ] **Step 2: 提交变更**

```bash
git add src/views/day/components/QuickAddDrawer.vue
git commit -m "fix(day): 提高 QuickAddDrawer 层级避免被导航栏遮挡"
```

---

## 任务 2: 修改 MobileAddEventDrawer.vue 层级

**Files:**
- Modify: `src/views/day/components/MobileAddEventDrawer.vue:12`

- [ ] **Step 1: 修改 MobileAddEventDrawer 的 z-index**

将第 12 行的 `z-101` 修改为 `z-[250]`：

```vue
<!-- 修改前 -->
<div 
  class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 ..."

<!-- 修改后 -->
<div 
  class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 ...
```

- [ ] **Step 2: 提交变更**

```bash
git add src/views/day/components/MobileAddEventDrawer.vue
git commit -m "fix(day): 提高 MobileAddEventDrawer 层级避免被导航栏遮挡"
```

---

## 任务 3: 修复 Sidebar.vue 左滑完成区域显示异常

**Files:**
- Modify: `src/views/day/components/Sidebar.vue:60-65`

- [ ] **Step 1: 添加 v-if 条件渲染**

在绿色完成区域的 div 上添加 `v-if="getSwipeOffset(index) > 0"`：

```vue
<!-- 修改前 -->
<div
  class="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-end pr-4"
  :style="{ width: `${getSwipeOffset(index)}px` }"
>
  <Check class="w-5 h-5 text-white" />
</div>

<!-- 修改后 -->
<div
  v-if="getSwipeOffset(index) > 0"
  class="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-end pr-4"
  :style="{ width: `${getSwipeOffset(index)}px` }"
>
  <Check class="w-5 h-5 text-white" />
</div>
```

- [ ] **Step 2: 提交变更**

```bash
git add src/views/day/components/Sidebar.vue
git commit -m "fix(day): 侧边栏左滑完成区域只在滑动时显示"
```

---

## 验证步骤

完成所有任务后，按以下方式验证：

1. **移动端弹窗层级验证**
   - 使用浏览器开发者工具切换到移动端视口（< 768px）
   - 打开新增任务抽屉/弹窗
   - 确认抽屉完整显示，不被顶部/底部导航栏遮挡

2. **侧边栏左滑功能验证**
   - 在移动端视口打开侧边栏
   - 在任务卡片上执行左滑操作
   - 确认绿色区域仅在滑动时出现，滑动结束后正确消失

---

## 自检清单

- [ ] 三个文件均已修改并提交
- [ ] z-index 值一致（均为 250）
- [ ] Sidebar.vue 的 v-if 条件正确添加
- [ ] 无其他副作用
