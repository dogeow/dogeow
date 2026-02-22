# 技术栈

## 后端

大致使用：

- [Laravel](https://laravel.com/) + [Reverb](https://laravel.com/docs/12.x/reverb)（WebSocket）

其他请查看仓库，地址 https://github.com/dogeow/dogeow-api

## 前端

- React + [Next.js](https://nextjs.org) 15
- [shadcn](https://ui.shadcn.com/)（UI） + Tailwind CSS
- Zustand（状态管理） + Immer（辅助）
- Zod（字段验证）
- react-hook-form（表单填写）
- (Lucide)[https://lucide.dev/]（图标）
- Canvas / Three.js
- SWR
- React DnD（拖放）
- Sentry (错误跟踪)
- Husky + lint-staged (Git钩子)
- GitHub Actions(自动化流程)

## 编写本代码时的规范

- 保存时自动格式化代码（Prettier）+ 提交代码时 ESLint 检查 + 推送时 TypeScript 检查
- 不 "AnyScript"、不 「// eslint-disable-next-line @typescript-eslint/no-explicit-any」注释。

> 这是目标（部分代码可能还没有改正）

## 构建与分析

项目使用 Next.js 的官方构建命令，脚本在 `package.json` 中配置：

```bash
npm run build           # 生产构建 (next build)
npm run analyze         # 生成 bundle 分析报告 (next experimental-analyze)
```

在 CI 中会额外跑一次 `npm run analyze` 并上传分析报告为构建产物；分析失败不会阻塞流水线。若 `next experimental-analyze` 输出目录有变，需同步修改 CI 中的 artifact path。

## 其他后续使用

- Vercel
