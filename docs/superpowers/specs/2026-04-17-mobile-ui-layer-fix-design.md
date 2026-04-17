# 移动端 UI 层级修复设计

**日期：** 2026-04-17
**类型：** Bug Fix
**状态：** Pending

---

## 1. 问题概述

移动端存在两个 UI 显示问题：

1. **问题 #2**：新增任务弹窗（QuickAddDrawer / MobileAddEventDrawer）被导航栏遮挡
2. **问题 #3**：侧边栏左滑完成任务时，绿色完成按钮区域显示异常

---

## 2. 问题分析

### 问题 #2：导航栏遮挡弹窗

**根本原因：** z-index 层级冲突

| 组件 | 当前 z-index | 层级关系 |
|------|-------------|---------|
| 移动端底部导航栏 | `z-[200]` | 最高 |
| 移动端顶部切换按钮 | `z-[200]` | 最高 |
| 移动端退出登录按钮 | `z-[200]` | 最高 |
| QuickAddDrawer | `z-101` | 低于导航栏 |
| MobileAddEventDrawer | `z-101` | 低于导航栏 |

**影响：** 弹窗打开时，导航栏浮在弹窗上方，遮挡用户操作。

### 问题 #3：侧边栏绿色区域异常

**根本原因：** 条件渲染缺失

```vue
<!-- 当前代码：即使 swipeOffset 为 0，div 元素仍存在 -->
<div
  class="absolute left-0 top-0 bottom-0 bg-green-500 ..."
  :style="{ width: `${getSwipeOffset(index)}px` }"
>
```

当 `swipeOffset = 0` 时，div 的宽度为 0，但元素本身仍然渲染，可能导致残留样式显示。

---

## 3. 修复方案

### 问题 #2：提高弹窗层级

**方案选择：** 直接提升弹窗 z-index（方案 A）

**理由：**
- 改动最小，仅修改两个组件的 z-index 值
- 不影响现有交互逻辑
- 导航栏层级 200，弹窗提升至 250 即可确保弹窗始终在最上层

**修改文件：**

1. `src/views/day/components/QuickAddDrawer.vue`
   - 第 12 行：`z-101` → `z-[250]`

2. `src/views/day/components/MobileAddEventDrawer.vue`
   - 第 12 行：`z-101` → `z-[250]`

### 问题 #3：添加条件渲染

**方案：** 当滑动距离大于 0 时才渲染绿色完成区域

**修改文件：**
- `src/views/day/components/Sidebar.vue`

**代码变更：**

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

## 4. 涉及文件

| 文件路径 | 修改类型 |
|----------|---------|
| `src/views/day/components/QuickAddDrawer.vue` | z-index 修改 |
| `src/views/day/components/MobileAddEventDrawer.vue` | z-index 修改 |
| `src/views/day/components/Sidebar.vue` | v-if 条件添加 |

---

## 5. 验证方式

### 问题 #2 验证
1. 在移动端视口（< 768px）打开应用
2. 点击任意位置触发新增任务弹窗/抽屉
3. 确认弹窗完整显示，不被顶部/底部导航栏遮挡
4. 确认导航栏按钮仍然可点击（如果需要交互）

### 问题 #3 验证
1. 在移动端视口打开侧边栏任务列表
2. 在任意任务卡片上执行左滑操作
3. 确认绿色区域仅在滑动时显示，滑动结束后正确消失
4. 确认滑动超过阈值后完成任务的功能正常

---

## 6. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 提升 z-index 后影响其他弹窗组件 | 低 | 仅修改弹窗组件自身层级，不影响全局 |
| v-if 导致重渲染闪烁 | 低 | 条件简单，切换无感知 |

**影响范围：** 仅限移动端 UI 显示，不涉及数据层和业务逻辑。
