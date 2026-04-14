# 编辑任务时间错误修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 day 页面编辑任务时间时 `RangeError: Invalid time value` 错误

**Architecture:** 在 `useAddEventForm.js` 的 `submit` 函数中添加时间验证，当 `form.time` 解析为无效值时，从 `initialData.original` 中重新获取有效时间。

**Tech Stack:** Vue 3 Composition API

---

## File Structure

- Modify: `src/views/day/composables/useAddEventForm.js`

---

## Task 1: 添加时间验证和回退逻辑

**Files:**
- Modify: `src/views/day/composables/useAddEventForm.js:58-87`

- [ ] **Step 1: 审查当前 submit 函数代码**

查看 `src/views/day/composables/useAddEventForm.js` 第 58-87 行，理解当前时间解析逻辑：

```javascript
const submit = withLoadingLock(async () => {
    if (!form.title || !form.time) return

    const [hours, minutes] = form.time.split(':').map(Number)
    const durationValue = parseFloat(form.duration)
    // ... 后续代码
})
```

- [ ] **Step 2: 添加时间验证和回退逻辑**

将 `submit` 函数中的时间解析部分修改为：

```javascript
const submit = withLoadingLock(async () => {
    if (!form.title || !form.time) return

    let hours, minutes
    
    // 尝试解析 form.time
    const timeParts = form.time.split(':').map(Number)
    const parsedHours = timeParts[0]
    const parsedMinutes = timeParts[1]
    
    // 验证时间值有效（不是 NaN 且在有效范围内）
    if (Number.isFinite(parsedHours) && Number.isFinite(parsedMinutes) 
        && parsedHours >= 0 && parsedHours <= 23 
        && parsedMinutes >= 0 && parsedMinutes <= 59) {
        hours = parsedHours
        minutes = parsedMinutes
    } else if (props.initialData?.original?.start_time) {
        // 回退：从原始数据重新获取有效时间
        const originalDate = new Date(props.initialData.original.start_time)
        if (!isNaN(originalDate.getTime())) {
            hours = originalDate.getHours()
            minutes = originalDate.getMinutes()
        } else {
            console.error('Invalid original start_time:', props.initialData.original.start_time)
            return
        }
    } else {
        console.error('Invalid time value and no fallback available:', form.time)
        return
    }

    const durationValue = parseFloat(form.duration)
    // ... 后续代码保持不变
})
```

- [ ] **Step 3: 验证修改**

运行 `pnpm dev`，打开 day 页面，编辑一个之前会导致错误的任务，确认不再报错。

- [ ] **Step 4: 提交**

```bash
git add src/views/day/composables/useAddEventForm.js
git commit -m "fix(day): add time validation in useAddEventForm to prevent Invalid time value error"
```

---

## 验证清单

- [ ] 1. 现有任务编辑功能正常
- [ ] 2. 新建任务功能正常
- [ ] 3. 无效时间数据触发回退逻辑时控制台无红色错误
- [ ] 4. 日期切换后任务列表正常显示
