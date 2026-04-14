# Day 页面 E2E 测试 + UX 分析计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 执行 Day 页面端到端测试，同时记录用户体验改进点

**Architecture:** 使用 Playwright MCP 工具进行浏览器自动化测试，同时观察 UX 问题并记录

**Tech Stack:** Playwright MCP, Supabase MCP

---

## 测试环境准备

### Prerequisites

- [ ] `pnpm dev` 运行在 `http://localhost:5173`
- [ ] Supabase MCP 已连接（执行 `mcp` 命令选择 supabase）
- [ ] 登录账号: `123456@163.com` / `123456`

---

## Phase 1: E2E 功能测试

### Task 1: 登录并进入 Day 页面

**Files:** 无（现有功能）

- [ ] **Step 1: 导航到登录页**

```js
mcp__playwright__browser_navigate("http://localhost:5173/login")
```

- [ ] **Step 2: 获取页面快照**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 3: 填写登录表单**

```js
mcp__playwright__browser_fill_form([
  { name: "Email", type: "textbox", value: "123456@163.com" },
  { name: "Password", type: "textbox", value: "123456" }
])
```

- [ ] **Step 4: 点击登录按钮**

```js
mcp__playwright__browser_click("登录")
```

- [ ] **Step 5: 导航到 Day 页面**

```js
mcp__playwright__browser_navigate("http://localhost:5173/day")
```

- [ ] **Step 6: 检查控制台错误**

```js
mcp__playwright__browser_console_messages("error")
```

- [ ] **Step 7: 截图记录**

```js
mcp__playwright__browser_take_screenshot()
```

**预期:** 无控制台 Error，页面正常加载

---

### Task 2: 任务 CRUD 测试

#### TC2.1: 创建任务

**Files:** 无（现有功能）

- [ ] **Step 1: 获取页面快照，找到添加按钮**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 2: 点击"添加项目"按钮**

```js
mcp__playwright__browser_click("添加项目")
```

- [ ] **Step 3: 获取弹窗快照**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 4: 填写任务表单**

```js
// 任务名称
mcp__playwright__browser_type("测试任务名称", {ref: "任务名称textbox"})
// 任务时间
mcp__playwright__browser_type("10:00", {ref: "任务时间textbox"})
// 任务时长
mcp__playwright__browser_type("60", {ref: "任务时长spinbutton"})
```

- [ ] **Step 5: 点击保存**

```js
mcp__playwright__browser_click("保存")
```

- [ ] **Step 6: 检查控制台**

```js
mcp__playwright__browser_console_messages("error")
```

- [ ] **Step 7: 截图验证**

```js
mcp__playwright__browser_take_screenshot()
```

**预期:** 任务出现在时间轴和侧边栏

#### TC2.2: 编辑任务

**Files:** `src/views/day/composables/useAddEventForm.js`

- [ ] **Step 1: 双击刚创建的任务打开编辑框**

```js
mcp__playwright__browser_snapshot()
// 找到测试任务的 ref
mcp__playwright__browser_click("测试任务名称", {dblClick: true})
```

- [ ] **Step 2: 获取编辑弹窗快照**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 3: 验证 form.time 值**

在 useAddEventForm.js 中添加临时日志：
```javascript
console.log('form.time:', form.time)
```

- [ ] **Step 4: 修改标题并保存**

```js
mcp__playwright__browser_snapshot()
// 找到标题输入框
mcp__playwright__browser_click("保存")
```

- [ ] **Step 5: 检查 Invalid time value 错误**

```js
mcp__playwright__browser_console_messages("error")
```

- [ ] **Step 6: 截图记录**

```js
mcp__playwright__browser_take_screenshot()
```

**预期:** 无 Invalid time value 错误

#### TC2.3: 删除任务

- [ ] **Step 1: 双击任务打开编辑框**

```js
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click("测试任务名称", {dblClick: true})
```

- [ ] **Step 2: 点击删除按钮**

```js
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click("删除此任务")
```

- [ ] **Step 3: 确认删除（在出现确认对话框时）**

```js
mcp__playwright__browser_handle_dialog(true)
```

- [ ] **Step 4: 截图验证**

```js
mcp__playwright__browser_take_screenshot()
```

**预期:** 任务从列表中消失

---

### Task 3: 日计划测试

**Files:** 无（现有功能）

- [ ] **Step 1: 点击添加项目，选择日计划类型**

```js
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click("添加项目")
mcp__playwright__browser_snapshot()
// 选择日计划选项（如果有）
mcp__playwright__browser_click("日计划")
```

- [ ] **Step 2: 填写日计划表单**

```js
mcp__playwright__browser_type("测试日计划", {ref: "标题输入框"})
```

- [ ] **Step 3: 保存**

```js
mcp__playwright__browser_click("保存")
```

- [ ] **Step 4: 截图验证**

```js
mcp__playwright__browser_take_screenshot()
```

**预期:** 日计划创建成功

---

### Task 4: 习惯打卡测试

**Files:** 无（现有功能）

- [ ] **Step 1: 查看今日习惯列表**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 2: 找到今日习惯**

在侧边栏找到习惯列表项

- [ ] **Step 3: 点击习惯复选框打卡**

```js
mcp__playwright__browser_snapshot()
// 找到第一个未打卡的习惯复选框
mcp__playwright__browser_click("习惯复选框")
```

- [ ] **Step 4: 截图验证打卡状态**

```js
mcp__playwright__browser_take_screenshot()
```

- [ ] **Step 5: 再次点击取消打卡**

```js
mcp__playwright__browser_click("已打卡复选框")
mcp__playwright__browser_take_screenshot()
```

**预期:** 打卡状态正确切换

---

### Task 5: 边界情况测试

**Files:** `src/views/day/composables/useAddEventForm.js`, `src/views/day/composables/useDayData.js`

#### TC5.1: 空时间字段

- [ ] **Step 1: 创建新任务（不清空时间）作为对照**

```js
mcp__playwright__browser_click("添加项目")
mcp__playwright__browser_fill_form([...])
mcp__playwright__browser_click("保存")
mcp__playwright__browser_take_screenshot()
```

- [ ] **Step 2: 编辑该任务，清空时间字段**

```js
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click("测试任务", {dblClick: true})
mcp__playwright__browser_snapshot()
// 清空时间输入框
mcp__playwright__browser_fill_form([
  { name: "任务时间", type: "textbox", value: "" }
])
```

- [ ] **Step 3: 保存并检查错误**

```js
mcp__playwright__browser_click("保存")
mcp__playwright__browser_console_messages("error")
mcp__playwright__browser_take_screenshot()
```

**预期:** 正确处理空时间，不报 Invalid time value

#### TC5.2: 时间解析验证

- [ ] **Step 1: 在 useDayData.js 添加临时日志**

在 `dailySchedule` computed 的第 88-94 行添加：

```javascript
console.log('task.start_time:', task.start_time, 'parsed:', new Date(task.start_time), 'timeStr:', startTimeStr)
```

- [ ] **Step 2: 刷新页面触发数据加载**

```js
mcp__playwright__browser_navigate("http://localhost:5173/day")
mcp__playwright__browser_wait_for(2) // 等待 2 秒
mcp__playwright__browser_console_messages("error")
```

- [ ] **Step 3: 移除临时日志**

恢复 useDayData.js

---

## Phase 2: UX 体验分析

### Task 6: 导航和页面结构分析

**观察点:**
- [ ] 侧边栏任务/日计划/习惯分类是否清晰
- [ ] 月份/日期导航是否直观
- [ ] 不同页面导航是否一致
- [ ] 当前日期状态是否明显

**记录到:** `docs/superpowers/specs/2026-04-14-day-page-ux-analysis.md`

- [ ] **Step 1: 截图记录当前状态**

```js
mcp__playwright__browser_take_screenshot()
```

- [ ] **Step 2: 记录观察到的 UX 问题**

在分析文档中记录

---

### Task 7: 任务管理流程分析

**观察点:**
- [ ] 创建任务入口是否明显
- [ ] 表单填写是否顺畅
- [ ] 时间选择器是否好用
- [ ] 操作反馈是否清晰

**记录到:** `docs/superpowers/specs/2026-04-14-day-page-ux-analysis.md`

- [ ] **Step 1: 截图记录任务创建流程**

```js
mcp__playwright__browser_click("添加项目")
mcp__playwright__browser_snapshot()
mcp__playwright__browser_take_screenshot()
```

---

### Task 8: 时间轴交互分析

**观察点:**
- [ ] 时间轴刻度是否清晰
- [ ] 任务位置是否准确
- [ ] 当前时间线是否可见

**记录到:** `docs/superpowers/specs/2026-04-14-day-page-ux-analysis.md`

- [ ] **Step 1: 截图记录时间轴**

```js
mcp__playwright__browser_take_screenshot()
```

---

### Task 9: 移动端体验分析

**观察点:**
- [ ] 移动端触摸目标大小
- [ ] 抽屉式组件流畅度
- [ ] 响应式布局

**记录到:** `docs/superpowers/specs/2026-04-14-day-page-ux-analysis.md`

- [ ] **Step 1: 模拟移动端视口**

```js
mcp__playwright__browser_resize(375, 812) // iPhone 尺寸
mcp__playwright__browser_navigate("http://localhost:5173/day")
mcp__playwright__browser_snapshot()
mcp__playwright__browser_take_screenshot()
```

---

## 测试结果汇总

### 通过/失败项

- [ ] TC2.1 创建任务
- [ ] TC2.2 编辑任务
- [ ] TC2.3 删除任务
- [ ] TC3 日计划
- [ ] TC4 习惯打卡
- [ ] TC5.1 空时间字段处理
- [ ] TC5.2 时间解析

### 发现的 UX 改进点

- [ ] 导航和页面结构
- [ ] 任务管理流程
- [ ] 时间轴交互
- [ ] 移动端适配
- [ ] 性能与反馈
