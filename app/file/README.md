# 文件管理模块

这是一个基于 Next.js 和 TypeScript 的文件管理系统，支持文件上传、下载、预览、搜索和组织功能。

## 📁 目录结构

```
app/file/
├── components/           # 组件
│   ├── FileHeader.tsx   # 文件头部组件（搜索、视图切换、操作按钮）
│   ├── FileExplorer.tsx # 文件浏览器主组件
│   ├── BreadcrumbNav.tsx # 面包屑导航
│   └── views/           # 不同视图组件
│       ├── GridView.tsx
│       ├── ListView.tsx
│       └── TreeView.tsx
├── hooks/               # 自定义 Hooks
│   ├── useFileOperations.ts # 文件操作相关 hooks
│   ├── useFileManagement.ts # 文件管理主 hook
│   └── useDebounce.ts   # 防抖 hooks
├── store/               # 状态管理
│   └── useFileStore.ts  # Zustand 文件状态管理
├── constants/           # 常量配置
│   └── index.ts         # 配置常量
├── types.ts             # TypeScript 类型定义
└── page.tsx             # 主页面组件
```

## 🚀 优化内容

### 1. 代码结构优化
- **关注点分离**: 将业务逻辑提取到自定义 hooks 中
- **组件职责单一**: FileHeader 组件专注于 UI 渲染
- **常量管理**: 统一管理配置常量，便于维护

### 2. 性能优化
- **防抖搜索**: 使用 `useDebounce` 减少搜索请求频率
- **并行操作**: 文件上传和删除支持并行处理
- **缓存优化**: 使用 SWR 进行数据缓存和同步

### 3. 用户体验优化
- **加载状态**: 添加加载指示器和进度显示
- **错误处理**: 统一的错误处理和用户友好的错误提示
- **批量操作**: 支持批量文件操作
- **视图切换**: 支持网格、列表、树形三种视图模式

### 4. 类型安全
- **TypeScript**: 完整的类型定义
- **类型推断**: 充分利用 TypeScript 类型推断
- **接口定义**: 清晰的 API 接口类型定义

## 🎯 主要功能

### 文件操作
- ✅ 文件上传（支持多文件、拖拽上传）
- ✅ 文件下载
- ✅ 文件删除（支持批量删除）
- ✅ 文件重命名
- ✅ 文件移动
- ✅ 文件预览

### 文件夹管理
- ✅ 创建文件夹
- ✅ 文件夹导航
- ✅ 面包屑导航
- ✅ 树形结构显示

### 搜索和筛选
- ✅ 实时搜索（防抖优化）
- ✅ 文件类型筛选
- ✅ 排序功能

### 视图模式
- ✅ 网格视图
- ✅ 列表视图
- ✅ 树形视图

## 🛠️ 技术栈

- **前端框架**: Next.js 15
- **状态管理**: Zustand
- **数据获取**: SWR
- **UI 组件**: Shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **类型检查**: TypeScript
- **图标**: Lucide React

## 📝 使用说明

### 基本使用

```tsx
import FileHeader from './components/FileHeader'
import FileExplorer from './components/FileExplorer'

export default function FilePage() {
  return (
    <div className="container mx-auto p-4">
      <FileHeader />
      <FileExplorer />
    </div>
  )
}
```

### 自定义 Hooks 使用

```tsx
import { useFileUpload, useCreateFolder, useDeleteFiles } from './hooks/useFileOperations'

function MyComponent() {
  const { handleFileUpload, isUploading } = useFileUpload()
  const { handleSubmit, isLoading } = useCreateFolder()
  const { deleteSelectedFiles, isDeleting } = useDeleteFiles()
  
  // 使用这些 hooks...
}
```

## 🔧 配置

### 上传配置

```typescript
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    'image/', 
    'video/', 
    'audio/', 
    'text/', 
    'application/pdf',
    // ... 更多类型
  ]
}
```

### 搜索配置

```typescript
export const SEARCH_CONFIG = {
  debounceDelay: 300, // 搜索防抖延迟
  minQueryLength: 1   // 最小搜索长度
}
```

## 🎨 自定义主题

组件使用 Tailwind CSS 和 CSS 变量，支持深色/浅色主题切换。

## 📦 依赖

主要依赖包括：
- `@radix-ui/react-*` - UI 组件基础
- `lucide-react` - 图标
- `zustand` - 状态管理
- `swr` - 数据获取
- `react-hot-toast` - 通知提示

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个文件管理系统。

## �� 许可证

MIT License 