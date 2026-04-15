# 公共模块文档

## 模块概述

`src/composables/` 和 `src/utils/` 包含跨视图复用的公共逻辑，供整个应用使用。

---

## Composables

### useMobile (`src/composables/useMobile.js`)

**职责：** 响应式移动设备检测，通过 `matchMedia` 监听视口宽度变化，返回 `isMobile` ref。

**导出的状态/方法：**
- `isMobile` - 布尔 ref，视口宽度小于 breakpoint（默认 768px）时为 true

**使用场景：** 条件渲染移动端/桌面端 UI 组件。

---

### useNotifications (`src/composables/useNotifications.js`)

**职责：** 任务通知 Composable，支持 Service Worker 后台通知 + 页面内降级轮询方案。

**导出的状态/方法：**
- `notificationPermission` - 当前通知授权状态 ref
- `requestPermission()` - 请求通知权限，同时注册 Service Worker
- `showNotification(title, options)` - 显示原生通知
- `startListening(getScheduleItems)` - 开始监听日程项并触发通知
- `stopListening()` - 停止监听
- `clearNotifiedHistory()` - 清除已通知记录（用于日期变更时重置）

**使用场景：** 习惯打卡、任务开始等日程提醒通知。

---

### useResizable (`src/composables/useResizable.js`)

**职责：** 可拖拽调整宽度 Composable，支持鼠标拖拽、范围限制、自动持久化到 localStorage。

**导出的状态/方法：**
- `width` - 当前宽度 ref
- `isResizing` - 是否正在拖拽中
- `startResize(e)` - 开始拖拽，绑定 mousemove/mouseup 事件

**实现细节：** 宽度持久化到 `localStorage.sidebar-width`。

---

### useToast (`src/composables/useToast.js`)

**职责：** Toast 通知 Composable，封装 `vue-sonner` 的 toast 方法。

**导出的状态/方法：**
- `toast` - 直接透传 vue-sonner 的 toast API

**使用场景：** 操作成功/失败等轻量提示。

---

## 工具函数

### audio (`src/utils/audio.js`)

**职责：** 音效播放工具，提供任务完成等场景的成功音效播放。

**导出的函数：**
- `playSuccessSound()` - 播放 success.mp3，音量 0.4，静音环境下自动吞掉错误

---

### dateFormatter (`src/utils/dateFormatter.js`)

**职责：** 月份数字转中英文本。

**导出的函数：**
- `getMonthName(monthNumber, format)` - 将 1-12 月份数字转为文本
  - `'zh'` → "一月"
  - `'en'` → "JANUARY"
  - `'full'` → "一月 (January)"

---

### throttle (`src/utils/throttle.js`)

**职责：** 节流函数，限制函数执行频率，支持 trailing 模式。

**导出的函数：**
- `throttle(fn, delay)` - 时间节流，默认 500ms
- `withLoadingLock(asyncFn)` - 异步请求锁，在 promise resolve/reject 前禁止重复调用

---

### formatDuration (`src/utils/formatDuration.js`)

**职责：** 时长格式化，将小时数/分钟数转为中文自然语言。

**导出的函数：**
- `formatDuration(hours)` - 将小时数（支持小数）转为中文，如 "1小时30分钟"
- `formatMinutes(minutes)` - 将分钟数转为中文（内部调用 formatDuration）

---

### dateParts (`src/utils/dateParts.js`)

**职责：** 日期解析工具，从字符串或 Date 对象中提取 ISO 格式的 year/month/day。

**导出的函数：**
- `getIsoDateParts(value)` - 返回 `{ year, month, day }` 或 null
- `getIsoYear(value)` / `getIsoMonth(value)` / `getIsoDay(value)` - 提取单个字段

---

## lib/utils.ts

**路径：** `src/lib/utils.ts`

**职责：** 合并 Tailwind CSS 类名的工具函数，集成 `clsx` + `tailwind-merge`。

**导出的函数：**
- `cn(...inputs)` - 合并 ClassValue，返回最终的 tailwind 样式字符串

**使用场景：** 组件中动态组合 Tailwind 类名。

---

## 文件清单

| 文件路径 | 备注 |
|---|---|
| `src/composables/useMobile.js` | 响应式移动端检测 |
| `src/composables/useNotifications.js` | 任务通知（SW + 降级轮询） |
| `src/composables/useResizable.js` | 可拖拽调整宽度 |
| `src/composables/useToast.js` | Toast 通知封装 |
| `src/utils/audio.js` | 成功音效播放 |
| `src/utils/dateFormatter.js` | 月份数字转文本 |
| `src/utils/throttle.js` | 节流 + 加载锁 |
| `src/utils/formatDuration.js` | 时长中文格式化 |
| `src/utils/dateParts.js` | 日期解析提取 |
| `src/lib/utils.ts` | Tailwind 类名合并 |
