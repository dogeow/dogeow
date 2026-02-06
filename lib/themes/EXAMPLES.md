# UI 主题系统示例

## 已创建的主题示例

### 1. 默认主题 (default)

- **布局**：当前的设计，顶部 Header，居中内容
- **特点**：保持原有 UI 不变

### 2. 侧边栏主题 (sidebar)

- **布局**：固定 Header + 左侧边栏 + 主内容区
- **特点**：
  - Header 固定在顶部，高度 60px
  - 左侧 240px 宽度的导航边栏
  - 主内容区域自适应
  - 卡片样式改为列表式，更紧凑
- **适用场景**：管理后台、仪表板

### 3. 极简主题 (minimal)

- **布局**：极简 Header + 大留白内容区
- **特点**：
  - Header 高度仅 48px，无边框
  - 内容区域大留白（3rem padding）
  - 卡片无背景、无边框，纯文字设计
  - 极简主义风格
- **适用场景**：博客、作品集、阅读类应用

## 界面变化对比

### 默认主题

```
┌─────────────────────────────────┐
│  Header (50px, sticky)          │
├─────────────────────────────────┤
│                                 │
│     内容区域 (居中, max-w-7xl)   │
│                                 │
└─────────────────────────────────┘
```

### 侧边栏主题

```
┌─────────────────────────────────┐
│  Header (60px, fixed)           │
├──────┬──────────────────────────┤
│      │                          │
│ 侧边 │   主内容区域 (100%)       │
│ 栏   │                          │
│(240px)                          │
└──────┴──────────────────────────┘
```

### 极简主题

```
┌─────────────────────────────────┐
│  Header (48px, 无边框)          │
├─────────────────────────────────┤
│                                 │
│   内容区域 (大留白, 1200px)     │
│                                 │
└─────────────────────────────────┘
```

## 如何切换主题

1. 打开设置面板
2. 进入"主题"设置
3. 在"UI 主题"下拉菜单中选择：
   - **默认主题**：保持当前设计
   - **侧边栏布局**：管理后台风格
   - **极简主题**：极简主义风格

切换后，整个界面会立即变化：

- ✅ Header 位置、高度、样式完全不同
- ✅ 布局结构完全不同（有无侧边栏）
- ✅ 卡片组件样式完全不同
- ✅ 间距、留白完全不同

## 让 AI 生成新主题

你可以这样告诉 AI：

```
基于 default 主题，创建一个新的 "dashboard" 主题：
- Header 固定在顶部，高度 64px，带搜索栏
- 左侧边栏宽度 280px，可折叠
- 主内容区域使用卡片网格布局
- 卡片样式使用玻璃态效果（backdrop-blur）
- 整体配色使用深色模式
```

AI 会：

1. 创建 `lib/themes/dashboard.ts` 配置文件
2. 创建 `components/themes/dashboard/Header.tsx`
3. 创建 `components/themes/dashboard/Sidebar.tsx`
4. 创建 `components/themes/dashboard/TileCard.tsx`（如果需要）
5. 在 `registry.ts` 中注册新主题

完成后，你就可以在设置中切换到新主题了！

## 主题组件接口

### Header 组件

```typescript
export default function ThemeHeader() {
  // 可以使用 useUITheme() 获取主题配置
  const theme = useUITheme()

  return (
    <div>
      {/* 你的 Header 设计 */}
    </div>
  )
}
```

### Sidebar 组件

```typescript
export default function ThemeSidebar() {
  return (
    <aside>
      {/* 你的 Sidebar 设计 */}
    </aside>
  )
}
```

### TileCard 组件

```typescript
interface TileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

export const TileCard = ({ tile, ...props }: TileCardProps) => {
  return (
    <button onClick={props.onClick}>
      {/* 你的卡片设计 */}
    </button>
  )
}
```

## 注意事项

1. **组件路径**：组件必须放在 `components/themes/{themeId}/` 目录下
2. **接口一致**：TileCard 等组件接口要保持一致，确保功能正常
3. **响应式**：确保所有主题都支持移动端
4. **性能**：使用动态导入，避免加载未使用的主题代码

## 下一步

- [ ] 创建更多主题示例（卡片式、列表式、网格式等）
- [ ] 添加主题预览功能
- [ ] 支持主题自定义配置
- [ ] 主题导入/导出功能
