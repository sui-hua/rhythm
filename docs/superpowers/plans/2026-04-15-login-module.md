# Login 模块文档

## 模块概述

Login 模块是应用的入口认证页面，基于 Supabase Auth 实现邮箱密码登录。用户在登录成功后会被重定向到首页 `/`，整个认证状态由 `authStore` 管理并支持持久化。

## 文件结构

```
src/views/login/
├── index.vue                        # 登录页视图组件
└── composables/
    └── useLoginForm.js               # 登录表单逻辑 Composable
```

## 组件说明

### `index.vue`

登录页主组件，渲染完整的登录界面。

- 包含邮箱、密码两个输入框，提交时调用 `handleLogin`
- 显示错误信息（认证失败时）
- 底部展示访客体验账号信息：`123456@163.com` / `123456`
- 登录按钮在请求过程中显示 loading 状态

**引入的 Composable：**
- `useLoginForm`：提供 `email`、`password`、`loading`、`error`、`handleLogin`

## Composables 说明

### `useLoginForm.js`

封装登录表单的状态和逻辑。

| 状态/方法 | 类型 | 说明 |
|---|---|---|
| `email` | `Ref<string>` | 邮箱输入值，默认 `123456@163.com` |
| `password` | `Ref<string>` | 密码输入值，默认 `123456` |
| `loading` | `Ref<boolean>` | 请求中状态 |
| `error` | `Ref<string>` | 错误提示信息 |
| `handleLogin` | `Function` | 触发 Supabase `signInWithPassword` 认证 |

## 认证流程简述

1. 用户填写邮箱、密码并提交表单
2. `handleLogin` 调用 `supabase.auth.signInWithPassword`
3. 认证成功：调用 `authStore.setUser(data.user)` 存储用户信息，跳转 `/`
4. 认证失败：设置 `error` 显示错误提示
5. 路由守卫 `router.beforeEach` 通过 `authStore.userId` 判断登录状态，未登录重定向到 `/login`

## 相关文件

- `src/stores/authStore.js` - 认证状态管理
- `src/config/supabase.js` - Supabase 客户端配置
- `src/router/index.js` - 路由守卫（登录拦截）
