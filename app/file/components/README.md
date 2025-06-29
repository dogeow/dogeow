# 面包屑导航组件优化

## 优化内容

### 1. 使用 SWR 替代手动状态管理
- **之前**: 使用 `useState` 和 `useEffect` 手动管理状态和 API 调用
- **现在**: 使用 SWR 提供自动缓存、重试、错误处理等功能

### 2. 创建自定义 Hook
- 将面包屑逻辑抽离到 `useBreadcrumbs` hook 中
- 提高代码复用性和可测试性
- 集中管理 SWR 配置

### 3. 性能优化
- 使用 `useMemo` 优化渲染性能
- 添加 `dedupingInterval` 避免重复请求
- 使用 `keepPreviousData` 保持数据连续性

### 4. 改进用户体验
- 添加专门的骨架加载组件 `BreadcrumbSkeleton`
- 优化错误状态显示
- 添加按钮悬停效果

### 5. 代码结构优化
- 分离关注点：组件只负责渲染，数据获取逻辑在 hook 中
- 更好的 TypeScript 类型支持
- 减少组件复杂度

## 文件结构

```
components/
├── BreadcrumbNav.tsx      # 主组件
├── BreadcrumbSkeleton.tsx # 骨架加载组件
└── README.md             # 说明文档

hooks/
└── useBreadcrumbs.ts     # 自定义数据获取 hook
```

## 配置说明

### SWR 配置
- `revalidateOnFocus: false` - 不在窗口聚焦时重新验证
- `revalidateOnReconnect: false` - 不在重新连接时重新验证
- `dedupingInterval: 60000` - 1分钟内不重复请求
- `errorRetryCount: 2` - 错误重试2次
- `keepPreviousData: true` - 保持之前的数据

### 性能优化点
1. **缓存策略**: 使用 SWR 的智能缓存避免重复请求
2. **渲染优化**: 使用 `useMemo` 缓存计算结果
3. **加载状态**: 专门的骨架组件提供更好的加载体验
4. **错误处理**: 统一的错误状态处理

## 使用方式

```tsx
import BreadcrumbNav from './components/BreadcrumbNav'

// 在文件管理页面中使用
<BreadcrumbNav />
```

组件会自动根据 `useFileStore` 中的 `currentFolderId` 状态获取和显示面包屑路径。 