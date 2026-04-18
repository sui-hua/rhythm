# NProgress Loading Bar Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current hand-rolled global loading bar with `nprogress` while keeping the existing global loading trigger points and applying a project-specific visual style.

**Architecture:** Keep `src/composables/useGlobalLoading.js` as the single source of truth for delayed show, minimum visible time, and concurrent request tracking. Swap the UI implementation from a Vue-rendered bar to `nprogress`'s DOM, and move the visual treatment into global CSS so the progress bar can be themed consistently across the app shell.

**Tech Stack:** Vue 3 (`<script setup>`), Vite 7, Tailwind CSS 4, `nprogress`, Supabase JS

---

## 文件结构与职责映射

- Modify: `package.json`（新增 `nprogress` 依赖）
- Modify: `src/composables/useGlobalLoading.js`（保留现有计数与防闪烁逻辑，改为驱动 `nprogress.start()` / `done()`）
- Modify: `src/components/ui/GlobalLoadingBar.vue`（从“渲染条本身”改成“注册 A11y 容器/生命周期钩子”，避免和 `nprogress` DOM 冲突）
- Modify: `src/assets/main.css`（覆盖 `#nprogress` 默认样式，落地项目主题视觉）
- Verify: `src/config/supabase.js`、`src/services/db/habits.js`、`src/services/db/summaries.js`（确认现有 `trackGlobalLoading(...)` 接入点无需改动）

---

### Task 1: 引入 `nprogress` 依赖并锁定接入范围

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 写失败验证（当前仓库缺少 `nprogress` 依赖）**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.90.1",
    "vue-sonner": "^2.0.9"
  }
}
```

当前状态里没有 `nprogress`，后续在 composable 中 `import NProgress from 'nprogress'` 会直接失败。

- [ ] **Step 2: 运行一次构建，记录基线**

Run: `pnpm build`  
Expected: BUILD SUCCESS，作为接入前基线，确认当前 loading 相关代码无编译问题。

- [ ] **Step 3: 修改依赖声明**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.90.1",
    "@tailwindcss/vite": "^4.1.18",
    "@vueuse/core": "^14.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-vue-next": "^0.562.0",
    "nprogress": "^0.2.0",
    "pinia": "^3.0.4",
    "pinia-plugin-persistedstate": "^4.7.1",
    "radix-vue": "^1.9.17",
    "reka-ui": "^2.7.0",
    "tailwind-merge": "^3.4.0",
    "tailwindcss": "^4.1.18",
    "vue": "^3.5.26",
    "vue-router": "^4.3.0",
    "vue-sonner": "^2.0.9"
  }
}
```

- [ ] **Step 4: 安装依赖并确认 lockfile 更新**

Run: `pnpm install`  
Expected: `nprogress` 被加入 lockfile，安装成功且无 peer dependency 阻塞错误。

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(loading): add nprogress dependency"
```

---

### Task 2: 用现有全局 loading 状态驱动 `nprogress`

**Files:**
- Modify: `src/composables/useGlobalLoading.js`

- [ ] **Step 1: 写失败验证（行为层仍然只切换本地 `visible`）**

```js
import { beginGlobalLoading, endGlobalLoading } from '@/composables/useGlobalLoading'

beginGlobalLoading()
setTimeout(() => endGlobalLoading(), 250)

// 预期失败：
// 当前实现只会更新 visible.value，无法驱动 #nprogress DOM 出现。
```

- [ ] **Step 2: 明确保留的状态边界**

保留以下行为，不因为接入三方库而回退：

```js
const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 300
const pendingCount = ref(0)
```

这些规则继续由本地 composable 控制，`nprogress` 只负责渲染和动画。

- [ ] **Step 3: 写最小实现（在现有 show/hide 位置对接 `nprogress`）**

```js
import NProgress from 'nprogress'
import { computed, ref } from 'vue'

NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 120,
  minimum: 0.08
})

function beginGlobalLoading() {
  pendingCount.value++
  if (pendingCount.value === 1) {
    clearTimeout(hideTimer)
    showTimer = setTimeout(() => {
      visible.value = true
      visibleAt = Date.now()
      NProgress.start()
    }, SHOW_DELAY_MS)
  }
}

function endGlobalLoading() {
  if (pendingCount.value <= 0) return
  pendingCount.value--
  if (pendingCount.value === 0) {
    clearTimeout(showTimer)
    const elapsed = Date.now() - visibleAt
    const remaining = MIN_VISIBLE_MS - elapsed
    const finish = () => {
      visible.value = false
      NProgress.done()
    }
    if (visible.value && remaining > 0) {
      hideTimer = setTimeout(finish, remaining)
    } else {
      finish()
    }
  }
}
```

- [ ] **Step 4: 保留对外接口稳定**

```js
function useGlobalLoading() {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

export { beginGlobalLoading, endGlobalLoading, trackGlobalLoading, useGlobalLoading }
```

`useGlobalLoading()` 继续暴露现有接口，避免影响 `GlobalLoadingBar.vue` 和未来调试。

- [ ] **Step 5: 运行构建验证接入无语法问题**

Run: `pnpm build`  
Expected: BUILD SUCCESS，且 `nprogress` import/configure 不触发 Vite 构建错误。

- [ ] **Step 6: Commit**

```bash
git add src/composables/useGlobalLoading.js
git commit -m "feat(loading): drive nprogress from global loading tracker"
```

---

### Task 3: 把组件职责从“画条”收敛成“挂载点与可访问性”

**Files:**
- Modify: `src/components/ui/GlobalLoadingBar.vue`

- [ ] **Step 1: 写失败验证（组件仍在渲染自己的条）**

```vue
<template>
  <Transition name="global-loading-fade">
    <div v-if="isGlobalLoading" class="global-loading">
      <div class="global-loading-track">
        <div class="global-loading-bar" />
      </div>
    </div>
  </Transition>
</template>
```

如果保留这段实现，接入 `nprogress` 后会出现“双条并存”风险。

- [ ] **Step 2: 写最小实现（只保留辅助语义，不再渲染视觉条）**

```vue
<template>
  <div
    v-if="isGlobalLoading"
    class="sr-only"
    aria-live="polite"
    aria-label="页面加载中"
    role="status"
  >
    页面加载中
  </div>
</template>

<script setup>
import { useGlobalLoading } from '@/composables/useGlobalLoading'

const { isGlobalLoading } = useGlobalLoading()
</script>
```

- [ ] **Step 3: 删除组件内旧样式，避免和全局 `#nprogress` 规则冲突**

```vue
<style scoped>
/* 删除 .global-loading / .global-loading-track / .global-loading-bar / keyframes */
</style>
```

如果文件必须保留 `<style scoped>` 结构，可写成最小空壳：

```vue
<style scoped>
</style>
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS，且 `GlobalLoadingBar` 仍能在 `App.vue` 正常挂载。

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/GlobalLoadingBar.vue
git commit -m "refactor(loading): reduce global loading bar component to accessibility hook"
```

---

### Task 4: 在全局样式里重写 `nprogress` 外观

**Files:**
- Modify: `src/assets/main.css`

- [ ] **Step 1: 写失败验证（默认 `nprogress` 样式不符合项目视觉）**

默认 `nprogress` 是网页常见亮蓝细条，和当前项目的黑白/中性色主题不一致，也没有现有界面里的柔和高光和阴影层次。

- [ ] **Step 2: 在全局样式文件追加 `#nprogress` 覆盖规则**

```css
@layer base {
  #nprogress {
    pointer-events: none;
  }

  #nprogress .bar {
    background:
      linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--foreground) 78%, white 22%) 18%, var(--foreground) 52%, color-mix(in oklab, var(--foreground) 70%, white 30%) 82%, transparent 100%);
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent),
      0 8px 20px -12px color-mix(in oklab, var(--foreground) 35%, transparent);
  }

  #nprogress .peg {
    display: block;
    position: absolute;
    right: 0;
    width: 120px;
    height: 100%;
    opacity: 0.9;
    transform: rotate(2deg) translateY(-1px);
    box-shadow:
      0 0 12px color-mix(in oklab, var(--foreground) 45%, transparent),
      0 0 24px color-mix(in oklab, var(--foreground) 20%, transparent);
  }

  #nprogress .spinner {
    display: none;
  }
}
```

- [ ] **Step 3: 补一条暗色兼容，避免 dark 模式太刺眼**

```css
.dark #nprogress .bar {
  background:
    linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--foreground) 70%, white 30%) 16%, var(--foreground) 50%, color-mix(in oklab, var(--foreground) 58%, white 42%) 84%, transparent 100%);
  box-shadow:
    0 0 0 1px color-mix(in oklab, white 12%, transparent),
    0 10px 24px -14px color-mix(in oklab, white 28%, transparent);
}
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS，`color-mix()` 与 CSS 层级在当前 Vite/Tailwind 方案下可正常通过。

- [ ] **Step 5: Commit**

```bash
git add src/assets/main.css
git commit -m "style(loading): customize nprogress to match app theme"
```

---

### Task 5: 验证现有触发链路无需改动，并完成手工验收

**Files:**
- Verify: `src/config/supabase.js`
- Verify: `src/services/db/habits.js`
- Verify: `src/services/db/summaries.js`

- [ ] **Step 1: 确认所有全局触发点仍走 `trackGlobalLoading(...)`**

```js
// src/config/supabase.js
return await trackGlobalLoading(async () => {
  const { data, error } = await supabase.from(tableName)...
})
```

```js
// src/services/db/habits.js / src/services/db/summaries.js
return await trackGlobalLoading(async () => {
  const { data, error } = await client.from('habit_logs')...
})
```

这一步只确认链路，不做行为改动。

- [ ] **Step 2: 运行开发环境做三组手工验收**

Run: `pnpm dev`  
Expected: 本地开发服务启动成功，可在浏览器访问。

手工验收清单：

```text
1) 慢请求 > 200ms：顶部 nprogress 出现，并在请求完成后平滑消失
2) 快请求 < 200ms：顶部条不出现，不闪烁
3) 并发请求：第一个请求完成时条不提前消失，要等最后一个请求结束
```

- [ ] **Step 3: 验证现有页面级 loading 不受影响**

```text
1) /direction 首屏 skeleton 仍出现
2) /habits 首屏 skeleton 仍出现
3) /day 的 sidebar/timeline 局部 loading 仍出现
4) 不出现“顶部 nprogress + 旧自绘顶部条”双重显示
```

- [ ] **Step 4: 做最终构建回归**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add src/config/supabase.js src/services/db/habits.js src/services/db/summaries.js
git commit -m "test(loading): verify nprogress migration preserves global trigger chain"
```

---

## Spec 覆盖自检

- 覆盖“保留现有全局 loading 触发点”：Task 2 + Task 5
- 覆盖“改成 `nprogress` 实现”：Task 1 + Task 2
- 覆盖“样式自定义而非默认蓝条”：Task 4
- 覆盖“避免双重 loading bar UI”：Task 3 + Task 5
- 覆盖“最小改动，不重写业务层”：Task 5

占位词检查：无 `TODO`、`TBD`、`稍后处理`。  
命名一致性检查：统一使用 `trackGlobalLoading`、`isGlobalLoading`、`pendingCount`、`NProgress`。  
范围检查：本计划只处理“全局顶部 loading bar 迁移到 nprogress”，不扩大到页面骨架或按钮 loading 重构。
