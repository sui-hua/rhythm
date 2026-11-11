# rhythm

## 结构

| 目录 | 说明 |
|------|------|
| `apps/web` | 桌面端 Web 应用（Vue 3 + Vite + Tailwind 4 + Pinia + Supabase） |
| `apps/mobile` | 移动端应用（Expo + React Native + NativeWind，2026-10 由独立仓库 subtree 合入，历史保留） |
| `apps/web-next` | Next.js 端（Next 16 + React 19 + Tailwind 4，数据走 `apps/api`） |
| `apps/api` | 后端服务（NestJS 12 + Prisma 7 + PostgreSQL，默认端口 3001，接口前缀 `/api`） |
| `packages/` | 预留跨端共享包 |

## 常用命令
```bash
pnpm install          # 安装全部依赖

pnpm dev              # 桌面端（Vue）开发服务器
pnpm build            # 桌面端生产构建
pnpm type-check       # 桌面端类型检查

pnpm mobile           # 移动端 Expo 开发服务器
pnpm mobile:typecheck # 移动端类型检查

pnpm next:dev         # Next 端开发服务器（http://localhost:3000）
pnpm next:build       # Next 端生产构建

pnpm api              # 后端开发服务器（http://localhost:3001/api）
pnpm api:build        # 后端生产构建
pnpm api:test         # 后端 e2e（需要本地 Postgres）
pnpm db:seed          # 写入演示数据
```

## 本地数据库
```bash
docker compose up -d   # 启动 Postgres（容器 postgres，库 rhythm，端口 5432）
pnpm db:seed           # 可选：灌入演示数据
```

