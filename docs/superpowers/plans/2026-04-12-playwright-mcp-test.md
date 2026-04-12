# Playwright MCP 测试执行计划

> **For agentic workers:** Use Playwright MCP tools to execute tests manually. This is a verification task.

**Goal:** 使用 Playwright MCP 验证三个修复

**测试环境**:
- URL: `http://localhost:5176`
- 账号: `123456@163.com`
- 密码: `123456`

---

## TC1: Toast 组件 + safeDb 成功路径

- [ ] **Step 1: 打开浏览器并导航到登录页**

```js
mcp__playwright__browser_navigate("http://localhost:5176/login")
```

- [ ] **Step 2: 获取页面快照确认元素**

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

- [ ] **Step 5: 进入 Day 模块**

```js
mcp__playwright__browser_navigate("http://localhost:5176/day")
```

- [ ] **Step 6: 点击"添加项目"按钮**

```js
mcp__playwright__browser_snapshot()
// 找到添加项目按钮的 ref
mcp__playwright__browser_click("添加项目")
```

- [ ] **Step 7: 填写任务表单并提交**

```js
// 填写任务标题
mcp__playwright__browser_type("text", "测试任务")
// 点击保存
mcp__playwright__browser_click("保存")
```

- [ ] **Step 8: 截图验证**

```js
mcp__playwright__browser_take_screenshot()
```

---

## TC2: Direction 完成率真实性

- [ ] **Step 1: 导航到 Direction 模块**

```js
mcp__playwright__browser_navigate("http://localhost:5176/direction")
```

- [ ] **Step 2: 获取页面快照**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 3: 找到侧边栏"系统推进负载"**

在 snapshot 中找到 `footer-value` 和 `Progress` 组件，验证值不再是 65%

- [ ] **Step 4: 截图**

```js
mcp__playwright__browser_take_screenshot()
```

---

## TC3: Habits 连击计算

- [ ] **Step 1: 导航到 Habits 模块**

```js
mcp__playwright__browser_navigate("http://localhost:5176/habits")
```

- [ ] **Step 2: 获取页面快照**

```js
mcp__playwright__browser_snapshot()
```

- [ ] **Step 3: 选择一个有打卡记录的习惯**

- [ ] **Step 4: 查看统计数据中的"当前连击"**

- [ ] **Step 5: 截图**

```js
mcp__playwright__browser_take_screenshot()
```

---

## TC4: 错误处理验证（可选）

- [ ] **Step 1: 在执行某个操作时触发错误**

- [ ] **Step 2: 观察是否显示 toast 错误提示**

- [ ] **Step 3: 截图记录**

---

## 通过标准

- [ ] TC1: Toast 正常工作，无 console error
- [ ] TC2: Direction 完成率不再是固定的 65%
- [ ] TC3: 连击数是连续天数而非总次数
