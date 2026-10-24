# rhythm

个人日程管理系统，pnpm monorepo。

## 结构

| 目录 | 说明 |
|------|------|
| `apps/web` | 桌面端 Web 应用（Vue 3 + Vite + Tailwind 4 + Pinia + Supabase） |
| `apps/mobile` | 移动端应用（Expo + React Native + NativeWind，2026-10 由独立仓库 subtree 合入，历史保留） |
| `packages/` | 预留跨端共享包 |

## 常用命令

在根目录执行：

```bash
pnpm install          # 安装全部依赖
pnpm dev              # 桌面端开发服务器
pnpm build            # 桌面端生产构建
pnpm type-check       # 桌面端类型检查
pnpm mobile           # 移动端 Expo 开发服务器
pnpm mobile:typecheck # 移动端类型检查
```

## 环境变量

- 桌面端：复制 `apps/web/.env.example` 为 `apps/web/.env`
- 移动端：`apps/mobile/.env`（不入库）

详细开发约定见 [AGENTS.md](./AGENTS.md)。
