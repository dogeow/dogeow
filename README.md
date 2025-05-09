# 技术栈

## 后端

- [Laravel](https://laravel.com/) + [Reverb](https://laravel.com/docs/12.x/reverb)（WebSocket）

## 前端

- React + [Next.js](https://nextjs.org)
- [shadcn](https://ui.shadcn.com/)（UI） + tailwind
- Zustand（状态管理） + Immer
- Zod（字段验证）
- react-hook-form（表单填写）
- Canvas / Three.js
- (Lucide)[https://lucide.dev/]（图标）

## 其他尚未使用

- dayjs
- lodash

## 音乐流式播放设置

为了启用音乐流式播放功能，请按照以下步骤操作：

1. 在项目根目录创建 `.env.local` 文件（如果不存在）
2. 添加以下环境变量：

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. 确保 API 服务器在 `http://localhost:8000` 上运行，并启用了音乐流式播放 API
4. 重启 Next.js 开发服务器

这将使音乐播放器能够使用后端 API 来流式传输音乐文件，实现边下载边播放的功能。
