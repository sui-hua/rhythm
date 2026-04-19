# Day 页面 UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 Day 页面 UX，覆盖移动端入口梳理、任务创建体验统一、表单验证、时长格式、触摸反馈和辅助功能 6 个方面。

**Architecture:**
- 将表单验证规则收敛到 `useAddEventForm.js`，移动端和桌面端共用
- 以 `MobileAddEventDrawer` 为主承载移动端任务创建流程，逐步吸收 `QuickAddDrawer` 能力
- 移动端表单使用已有的 `TimePicker` / `DurationPicker` 组件
- 时长格式化抽取到 `src/utils/formatDuration.js` 工具函数
- Day 页面入口改造必须同时覆盖“打开侧边栏”和“新增任务”两个独立入口

**Tech Stack:** Vue 3, Composition API, Tailwind CSS 4

---

## 文件结构

```
src/
├── utils/
│   └── formatDuration.js          # 新建：时长格式化工具
├── views/day/
│   ├── composables/
│   │   ├── useAddEventForm.js     # 改造：添加验证规则和 computed 验证状态
│   │   └── useQuickAddForm.js     # 暂保留：入口整合稳定后再决定是否删除
│   └── components/
│       ├── QuickAddDrawer.vue      # 暂保留：用于过渡期验证
│       ├── MobileAddEventDrawer.vue # 改造：整合 QuickAdd 能力 + 表单验证 + TimePicker/DurationPicker
│       └── AddEventModal.vue       # 改造：同步接入统一验证状态
└── views/day/index.vue            # 改造：统一入口按钮语义
```

---

## Task 1: 创建时长格式化工具

**文件:**
- Create: `src/utils/formatDuration.js`

**目标:** 提供统一的时长格式化函数，输出中文自然语言格式。

- [ ] **Step 1: 创建工具文件**

```javascript
// src/utils/formatDuration.js

/**
 * 将小时数转换为中文自然语言格式
 * @param {number} hours - 小时数，支持小数
 * @returns {string} 中文格式，如 "30分钟"、"1小时"、"3小时30分钟"
 */
export function formatDuration(hours) {
    if (!hours || hours <= 0) {
        return '0分钟'
    }

    const totalMinutes = Math.round(hours * 60)

    if (totalMinutes < 60) {
        return `${totalMinutes}分钟`
    }

    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60

    if (m === 0) {
        return `${h}小时`
    }

    return `${h}小时${m}分钟`
}

/**
 * 将分钟数转换为中文自然语言格式
 * @param {number} minutes - 分钟数
 * @returns {string} 中文格式
 */
export function formatMinutes(minutes) {
    return formatDuration(minutes / 60)
}
```

- [ ] **Step 2: 验证工具函数**

```javascript
// 在浏览器控制台或测试文件中验证：
// formatDuration(0.5)  => "30分钟"
// formatDuration(1)    => "1小时"
// formatDuration(1.5)  => "1小时30分钟"
// formatDuration(3.5)  => "3小时30分钟"
// formatMinutes(90)    => "1小时30分钟"
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/formatDuration.js
git commit -m "feat(day): add formatDuration utility for consistent duration display"
```

---

## Task 2: 改造 useAddEventForm 添加验证规则

**文件:**
- Modify: `src/views/day/composables/useAddEventForm.js:1-141`

**目标:** 添加实时验证状态（`isValid`、`errors`），供表单组件使用。

- [ ] **Step 1: 添加验证相关 computed**

在 `useAddEventForm.js` 的 `return` 之前添加：

```javascript
// 验证规则
const validationRules = {
    title: (v) => v.trim() ? '' : '任务名称不能为空',
    time: (v) => v ? '' : '开始时间不能为空',
    duration: (v) => {
        const num = parseFloat(v)
        if (isNaN(num) || num <= 0) return '时长必须大于0'
        return ''
    }
}

// 计算属性：实时验证错误信息
const errors = computed(() => ({
    title: validationRules.title(form.title),
    time: validationRules.time(form.time),
    duration: validationRules.duration(form.duration)
}))

// 计算属性：表单是否有效
const isValid = computed(() => {
    return !errors.value.title && !errors.value.time && !errors.value.duration
})
```

- [ ] **Step 2: 更新 submit 方法中的校验逻辑**

将 `submit` 方法开头的校验：

```javascript
// 原：
const submit = withLoadingLock(async () => {
    if (!form.title || !form.time) return

// 改为使用 isValid：
const submit = withLoadingLock(async () => {
    if (!isValid.value) return
```

- [ ] **Step 3: 在 return 中导出新增的状态**

```javascript
return {
    form,
    isHabit,
    errors,
    isValid,
    submit,
    handleDelete
}
```

- [ ] **Step 4: 提交**

```bash
git add src/views/day/composables/useAddEventForm.js
git commit -m "feat(day): add validation state to useAddEventForm"
```

---

## Task 3: 改造 MobileAddEventDrawer 整合 QuickAdd

**文件:**
- Modify: `src/views/day/components/MobileAddEventDrawer.vue:1-149`

**目标:**
1. 整合 QuickAdd 简化流程（默认显示名称+快捷时长）
2. 使用 `TimePicker` / `DurationPicker` 替代原生 input
3. 添加实时表单验证提示
4. 按钮禁用状态更明显
5. 添加 aria-label
6. 保持提交事件语义正确，不允许输入组件回车时直接关闭抽屉

- [ ] **Step 1: 更新 template - 添加验证提示和必填标记**

找到任务名称 label，在其后添加星号：

```html
<!-- 原有 -->
<label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">项目名称</label>

<!-- 改为 -->
<label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
    项目名称<span class="text-rose-500">*</span>
</label>
```

- [ ] **Step 2: 在名称输入框下方添加验证提示**

在输入框 `</input>` 后添加：

```html
<p v-if="errors.title" class="text-xs text-rose-500 mt-1 px-1">{{ errors.title }}</p>
```

- [ ] **Step 3: 替换时间为 TimePicker 组件**

```html
<!-- 原有 -->
<div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
        <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">开始时间</label>
        <input
            v-model="form.time"
            type="time"
            class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
        />
    </div>

<!-- 改为 -->
<div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
        <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
            开始时间<span class="text-rose-500">*</span>
        </label>
        <TimePicker
            v-model="form.time"
            placeholder="08:00"
            @submit="submit"
        />
        <p v-if="errors.time" class="text-xs text-rose-500 mt-1 px-1">{{ errors.time }}</p>
    </div>
```

- [ ] **Step 4: 替换时长为 DurationPicker 组件**

```html
<!-- 原有时长输入 -->
<div class="flex flex-col gap-2">
    <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">预计时长</label>
    <div class="relative flex items-center">
        <input
            v-model="form.duration"
            type="number"
            step="0.5"
            class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <span class="absolute right-4 text-sm text-zinc-400 font-medium pointer-events-none">小时</span>
    </div>
</div>

<!-- 改为 -->
<div class="flex flex-col gap-2">
    <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">预计时长</label>
    <DurationPicker v-model="form.duration" @submit="submit" />
    <p v-if="errors.duration" class="text-xs text-rose-500 mt-1 px-1">{{ errors.duration }}</p>
</div>
```

- [ ] **Step 5: 更新默认时长显示**

将显示区中的 `{{ form.duration }}小时` 改为使用格式化工具：

```html
<span>{{ formatDuration(form.duration) }}</span>
```

在 script 中添加 import：

```javascript
import { formatDuration } from '@/utils/formatDuration'
```

- [ ] **Step 6: 更新提交按钮禁用状态更明显**

```html
<!-- 原有 -->
<button
    @click="submit"
    :disabled="!form.title || !form.time"
    class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>

<!-- 改为 -->
<button
    @click="submit"
    :disabled="!isValid"
    class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 transition-all disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed active:scale-[0.97]"
>
```

- [ ] **Step 7: 添加 aria-label 到图标按钮**

在删除按钮添加：

```html
<button
    v-if="initialData && !isHabit"
    @click="handleDelete"
    aria-label="删除项目"
    class="flex-1 h-12 rounded-xl text-sm font-semibold text-rose-500 active:bg-rose-50"
>
```

- [ ] **Step 8: 提交**

```bash
git add src/views/day/components/MobileAddEventDrawer.vue
git commit -m "feat(day): integrate QuickAdd into MobileAddEventDrawer with validation"
```

---

## Task 4: 改造 Day 页面入口按钮语义

**文件:**
- Modify: `src/views/day/index.vue`
- Modify: `src/views/day/components/Sidebar.vue`（如需要补充侧边栏打开/关闭语义）

**目标:** 明确区分"打开侧边栏"和"新增任务"两个入口按钮的语义。

- [ ] **Step 1: 检查 index.vue 中浮动按钮的当前实现**

```bash
grep -n "QuickAdd\|Menu\|X\|新增" src/views/day/index.vue
```

- [ ] **Step 2: 根据实际情况调整按钮图标和 aria-label**

必须同时满足：

- 浮动“新增任务”按钮使用 `Plus` 或 `PlusCircle` 图标，而非 `Menu/X`
- “打开侧边栏”拥有独立入口和独立点击事件
- 两个入口都具备明确 `aria-label`
- 不允许仅通过“替换图标”完成此任务，必须完成入口职责拆分

- [ ] **Step 3: 明确状态和事件绑定**

至少确认以下状态流：

- 打开侧边栏：修改 `showSidebar`
- 打开新增任务：打开移动端创建流程（过渡期可仍然经过 `showQuickAdd`）
- 关闭新增任务时，不影响侧边栏状态
- 打开侧边栏时，不应误触任务创建流程

- [ ] **Step 4: 提交**

```bash
git add src/views/day/index.vue
git commit -m "feat(day): clarify mobile entry point button semantics"
```

---

## Task 5: 同步桌面端 AddEventModal 的验证反馈

**文件:**
- Modify: `src/views/day/components/AddEventModal.vue`

**目标:** 让桌面端表单与移动端共用相同的验证状态和交互反馈。

- [ ] **Step 1: 从 useAddEventForm 中接入 `errors` 和 `isValid`**

```javascript
const { form, isHabit, errors, isValid, submit, handleDelete } = useAddEventForm(props, emit)
```

- [ ] **Step 2: 补充桌面端验证提示和必填标记**

至少覆盖：

- 任务名称必填提示
- 时间必填提示
- 时长非法提示
- 提交按钮禁用态改为 `:disabled="!isValid"`

- [ ] **Step 3: 提交**

```bash
git add src/views/day/components/AddEventModal.vue
git commit -m "feat(day): align desktop form validation feedback with mobile"
```

---

## Task 6: 更新 TaskItem 时长显示

**文件:**
- Modify: `src/views/day/components/TaskItem.vue`
- Modify: `src/views/day/composables/useDayData.js`

**目标:** 使用统一格式化策略替换小数小时展示。

- [ ] **Step 1: 确认格式化输入源**

不要直接将字符串类型的 `task.duration` 传给 `formatDuration`。  
优先采用以下两种方式之一：

- 在 `useDayData.js` 中直接用 `formatDuration(rawDuration)` 生成最终展示文案
- 或在 `TaskItem.vue` 中使用 `task.rawDuration` / 明确的数值字段进行格式化

- [ ] **Step 2: 更新聚合层或展示层**

确保以下文案不再出现：

- `3.5小时`
- `1.0小时`

统一为：

- `30分钟`
- `1小时`
- `3小时30分钟`

- [ ] **Step 3: 提交**

```bash
git add src/views/day/components/TaskItem.vue src/views/day/composables/useDayData.js src/utils/formatDuration.js
git commit -m "feat(day): use natural Chinese duration display in day items"
```

---

## Task 7: 统一触摸反馈规范

**文件:**
- Modify: `src/views/day/components/MobileAddEventDrawer.vue`
- Modify: `src/views/day/components/Sidebar.vue`（如有必要）

**目标:** 按钮统一 `active:scale-[0.97]` 触摸反馈。

- [ ] **Step 1: 检查所有按钮的触摸反馈**

在 `MobileAddEventDrawer.vue` 和 `Sidebar.vue` 中查找缺少 `active:scale` 的按钮，确保都有统一的触摸反馈。

- [ ] **Step 2: 添加缺失的 aria-label**

确保所有图标按钮都有 aria-label。

- [ ] **Step 3: 提交**

```bash
git add src/views/day/components/MobileAddEventDrawer.vue src/views/day/components/Sidebar.vue
git commit -m "feat(day): unify touch feedback on mobile buttons"
```

---

## Task 8: 辅助功能审查

**文件:**
- Modify: 相关组件文件

**目标:** 满足 WCAG AA 可访问性标准。

- [ ] **Step 1: 全局检查图标按钮 aria-label**

```bash
grep -rn "aria-label" src/views/day/
```

确保所有图标按钮（关闭按钮、删除按钮、分类按钮等）都有 aria-label。

- [ ] **Step 2: 检查颜色对比度**

检查按钮文字和背景的颜色对比度是否符合 4.5:1 标准。

- [ ] **Step 3: 提交**

```bash
git add src/views/day/
git commit -m "feat(day): add aria-labels for accessibility compliance"
```

---

## Task 9: 过渡期清理（可选）

**文件:**
- Delete: `src/views/day/components/QuickAddDrawer.vue`
- Delete: `src/views/day/composables/useQuickAddForm.js`

**目标:** 在入口整合和移动端创建流程稳定后，清理过渡期遗留代码。

- [ ] **Step 1: 确认无引用**

```bash
rg -n "QuickAddDrawer|useQuickAddForm" src
```

除当前待删除文件外，应无业务引用。

- [ ] **Step 2: 确认验收测试已通过**

必须先满足：

- 移动端已有清晰的“打开侧边栏”入口
- 移动端已有清晰的“新增任务”入口
- 用户只感知一条任务创建流程

- [ ] **Step 3: 删除文件**

```bash
git rm src/views/day/components/QuickAddDrawer.vue src/views/day/composables/useQuickAddForm.js
```

- [ ] **Step 4: 提交**

```bash
git commit -m "refactor(day): remove transitional quick add implementation"
```

---

## Task 10: 验收测试

**目标:** 验证所有验收标准。

- [ ] **Step 1: 移动端入口测试**
  - [ ] 打开侧边栏按钮有明确语义（Menu 图标）
  - [ ] 新增任务按钮有明确语义（Plus 图标）
  - [ ] 关闭按钮触摸热区 ≥ 44x44px

- [ ] **Step 2: 表单验证测试**
  - [ ] 空名称提交时显示"任务名称不能为空"
  - [ ] 空时间提交时显示"开始时间不能为空"
  - [ ] 时长 ≤ 0 时显示"时长必须大于0"
  - [ ] 禁用按钮状态明显（灰色背景 + 降低透明度）

- [ ] **Step 3: 时长显示测试**
  - [ ] `3.5小时` 不再出现
  - [ ] 显示为 `3小时30分钟`

- [ ] **Step 4: 桌面端一致性测试**
  - [ ] 桌面端与移动端都能显示相同的必填错误提示
  - [ ] 桌面端提交按钮禁用逻辑与移动端一致

- [ ] **Step 5: 单一入口测试**
  - [ ] 移动端只有一个任务创建流程
  - [ ] 默认简化表单，可展开完整表单

- [ ] **Step 6: 提交**

```bash
git commit -m "test(day): add UX optimization verification"
```

---

## 实施顺序

1. **Task 1** - 创建工具函数（基础依赖）
2. **Task 2** - 改造 useAddEventForm（验证规则）
3. **Task 3** - 改造 MobileAddEventDrawer（核心 UI）
4. **Task 4** - 改造 Day 入口按钮
5. **Task 5** - 同步桌面端 AddEventModal 的验证反馈
6. **Task 6** - 更新 TaskItem 时长显示
7. **Task 7** - 统一触摸反馈
8. **Task 8** - 辅助功能审查
9. **Task 9** - 过渡期清理（可选）
10. **Task 10** - 验收测试
