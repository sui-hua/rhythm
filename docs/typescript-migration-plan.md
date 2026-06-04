# TypeScript 迁移计划

> **状态：已完成** (2026-06-04)

## 项目概况

将 rhythm 项目从 JavaScript 迁移到 TypeScript，涉及约 198 个文件。

## 迁移范围

### 配置文件（2 个）
- `vite.config.js` → `vite.config.ts`
- `vitest.config.js` → `vitest.config.ts`

### 需要创建的文件（2 个）
- `tsconfig.json` - TypeScript 配置
- `src/env.d.ts` - Vue SFC 类型声明

### JavaScript 源文件（63 个）
按目录分组：
- `src/` 根目录：`main.js`
- `src/config/`：`uiGrammar.js`
- `src/content/`：`pageNarratives.js`
- `src/composables/`：4 个文件
- `src/router/`：`index.js`
- `src/services/`：11 个文件（database.js, supabase.js, db/*.js）
- `src/stores/`：12 个文件
- `src/utils/`：5 个文件
- `src/views/day/`：13 个文件（composables/ + utils/）
- `src/views/direction/`：7 个文件
- `src/views/habits/`：6 个文件
- `src/views/login/`：1 个文件
- `src/views/month/`：1 个文件
- `src/views/summary/`：8 个文件
- `src/views/year/`：1 个文件

### Vue 文件（94 个）
所有 `.vue` 文件需要将 `<script>` 改为 `<script lang="ts">`

### 测试文件（37 个）
所有 `.spec.js` 文件重命名为 `.spec.ts`

## 实施步骤

### 阶段 1：基础配置
1. 创建 `tsconfig.json`
2. 创建 `src/env.d.ts`
3. 重命名 `vite.config.js` → `vite.config.ts`
4. 重命名 `vitest.config.js` → `vitest.config.ts`

### 阶段 2：核心服务层
1. `src/services/supabase.js`
2. `src/services/database.js`
3. `src/services/db/*.js`（11 个文件）

### 阶段 3：状态管理
1. `src/stores/*.js`（12 个文件）

### 阶段 4：工具函数
1. `src/utils/*.js`（5 个文件）

### 阶段 5：Composables
1. `src/composables/*.js`（4 个全局 composables）
2. `src/views/*/composables/*.js`（各模块 composables）

### 阶段 6：路由和配置
1. `src/router/index.js`
2. `src/config/uiGrammar.js`
3. `src/content/pageNarratives.js`
4. `src/main.js`

### 阶段 7：Vue 文件
1. 所有 `.vue` 文件添加 `<script lang="ts">`

### 阶段 8：测试文件
1. 所有 `.spec.js` 重命名为 `.spec.ts`

## 迁移策略

### 文件重命名
```bash
# 使用 git mv 保持历史记录
git mv src/file.js src/file.ts
```

### 类型注解添加
- 函数参数和返回值
- 响应式变量类型
- Props 和 Emits 定义
- 模块导出类型

### Vue 组件迁移
```vue
<!-- 之前 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<!-- 之后 -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref<number>(0)
</script>
```

## 验证检查点

每个阶段完成后运行：
```bash
pnpm vue-tsc    # TypeScript 类型检查
pnpm build      # 构建验证
pnpm test:unit  # 单元测试
```

## 风险与注意事项

1. **渐进式迁移**：可以分模块迁移，不必一次性完成
2. **类型严格性**：初期可以使用 `any` 作为占位符，后续逐步完善
3. **测试覆盖**：迁移后确保所有测试仍然通过
4. **导入路径**：重命名文件后检查所有导入语句
