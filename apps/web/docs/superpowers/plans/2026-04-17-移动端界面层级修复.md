# 移动端 UI 层级修复实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复移动端抽屉与导航栏的层级冲突，并修复侧边栏任务左滑完成区域在未滑动时的异常显示。

**Architecture:** 本次修复仅涉及 `day` 视图的三个组件，不调整现有页面结构或 Composable 设计。实现方式是统一移动端抽屉的遮罩层与面板层级关系，确保其高于移动端导航栏但低于日报弹窗；同时为侧边栏左滑完成区域增加条件渲染，避免宽度为 0 时仍渲染内容。

**Tech Stack:** Vue 3, Tailwind CSS 4

> **注意：** 执行完成后不要提交，由用户自己提交。

---

## 现状与修复目标

- 当前移动端导航栏位于 `z-[200]`，定义在 `src/components/Navbar.vue`。
- 当前 `QuickAddDrawer` 与 `MobileAddEventDrawer` 的遮罩层为 `z-100`，抽屉面板为 `z-101`，因此在移动端会被导航栏压住。
- 若只提高抽屉面板层级而不提高遮罩层级，会出现“抽屉盖过导航，但导航仍浮在遮罩之上并可能继续响应点击”的不一致状态。
- 当前日报弹窗 `DailyReportModal` 使用 `z-[300]` / `z-[301]`，本次修复不能影响它的优先级。

### 目标层级

- `Navbar`: `z-[200]`
- `Drawer Backdrop`: `z-[240]`
- `Drawer Panel`: `z-[250]`
- `DailyReportModal Backdrop`: `z-[300]`
- `DailyReportModal Panel`: `z-[301]`

---

## 文件变更总览

| 文件 | 修改类型 |
|------|---------|
| `src/views/day/components/QuickAddDrawer.vue` | 遮罩层与抽屉面板 z-index 调整 |
| `src/views/day/components/MobileAddEventDrawer.vue` | 遮罩层与抽屉面板 z-index 调整 |
| `src/views/day/components/Sidebar.vue` | 左滑完成区域条件渲染调整 |

---

## 任务 1: 修复 QuickAddDrawer.vue 层级

**Files:**
- Modify: `src/views/day/components/QuickAddDrawer.vue:6`
- Modify: `src/views/day/components/QuickAddDrawer.vue:12`

- [ ] **调整 QuickAddDrawer 遮罩层级**

将遮罩层的 `z-100` 修改为 `z-[240]`：

```vue
<!-- 修改前 -->
<div
  v-if="show"
  class="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
  @click="handleClose"
></div>

<!-- 修改后 -->
<div
  v-if="show"
  class="fixed inset-0 z-[240] bg-black/40 backdrop-blur-[2px]"
  @click="handleClose"
></div>
```

- [ ] **调整 QuickAddDrawer 面板层级**

将抽屉面板的 `z-101` 修改为 `z-[250]`：

```vue
<!-- 修改前 -->
<div
  class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
  :class="show ? 'translate-y-0' : 'translate-y-full'"
  style="max-height: 50vh;"
>

<!-- 修改后 -->
<div
  class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
  :class="show ? 'translate-y-0' : 'translate-y-full'"
  style="max-height: 50vh;"
>
```

---

## 任务 2: 修复 MobileAddEventDrawer.vue 层级

**Files:**
- Modify: `src/views/day/components/MobileAddEventDrawer.vue:6`
- Modify: `src/views/day/components/MobileAddEventDrawer.vue:12`

- [ ] **调整 MobileAddEventDrawer 遮罩层级**

将遮罩层的 `z-100` 修改为 `z-[240]`：

```vue
<!-- 修改前 -->
<div
  v-if="show"
  class="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
  @click="$emit('update:show', false)"
></div>

<!-- 修改后 -->
<div
  v-if="show"
  class="fixed inset-0 z-[240] bg-black/40 backdrop-blur-[2px]"
  @click="$emit('update:show', false)"
></div>
```

- [ ] **调整 MobileAddEventDrawer 面板层级**

将抽屉面板的 `z-101` 修改为 `z-[250]`：

```vue
<!-- 修改前 -->
<div
  class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
  :class="show ? 'translate-y-0' : 'translate-y-full'"
  style="max-height: 92vh;"
>

<!-- 修改后 -->
<div
  class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
  :class="show ? 'translate-y-0' : 'translate-y-full'"
  style="max-height: 92vh;"
>
```

---

## 任务 3: 修复 Sidebar.vue 左滑完成区域显示异常

**Files:**
- Modify: `src/views/day/components/Sidebar.vue:60-65`

- [ ] **为左滑完成区域添加条件渲染**

在绿色完成区域的 `div` 上添加 `v-if="getSwipeOffset(index) > 0"`，确保只有在实际左滑偏移大于 0 时才渲染该区域：

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

---

## 验证步骤

完成所有任务后，按以下方式验证：

1. **移动端快速添加抽屉层级验证**
   - 使用浏览器开发者工具切换到移动端视口（`< 768px`）。
   - 进入 `/day` 页面，点击右下角加号打开 `QuickAddDrawer`。
   - 确认底部抽屉完整显示在移动端顶部/底部导航之上。
   - 确认半透明遮罩也覆盖导航区域，导航按钮不可被误点。
   - 关闭抽屉后，页面交互恢复正常。

2. **移动端完整任务抽屉层级验证**
   - 在移动端视口点击“添加项目”或编辑某个任务，打开 `MobileAddEventDrawer`。
   - 确认抽屉完整显示在导航之上，且未被底部导航遮挡。
   - 确认遮罩层覆盖导航区域。
   - 确认打开抽屉后仍不会盖过 `DailyReportModal` 这类更高优先级弹层。

3. **日报弹窗回归验证**
   - 在可触发日报弹窗的条件下打开 `DailyReportModal`。
   - 确认其仍然显示在两个 drawer 之上，没有被新的 `z-index` 影响。

4. **侧边栏左滑显示验证**
   - 在移动端视口打开侧边栏。
   - 未滑动任务卡片时，确认绿色完成区域完全不显示。
   - 对任务卡片执行左滑操作，确认绿色区域随滑动出现。
   - 松手后确认区域正常收起；达到完成阈值时任务状态可正常切换。

---

## 自检清单

- [ ] 三个目标文件均已修改
- [ ] 两个 drawer 的遮罩层级均为 `z-[240]`
- [ ] 两个 drawer 的面板层级均为 `z-[250]`
- [ ] 层级关系满足 `Navbar < Drawer Backdrop < Drawer Panel < DailyReportModal`
- [ ] `Sidebar.vue` 的 `v-if="getSwipeOffset(index) > 0"` 已正确添加
- [ ] 未引入新的层级冲突或点击穿透问题
