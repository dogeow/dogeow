# 代码重构使用指南

## 🎯 概述

本指南说明如何使用重构后的代码架构，以及如何继续完善未完全重构的部分。

---

## 📁 重构后的目录结构

### 游戏模块

#### 射击游戏（完全重构 ✅）

```
app/game/shooting-range/
├── components/
│   ├── ShootingGame.tsx          # 主组件 (306行)
│   └── game/                      # 子组件目录
│       ├── Explosion.tsx          # 爆炸效果
│       ├── Target.tsx             # 目标
│       ├── GunModel.tsx           # 枪支模型
│       ├── Crosshair.tsx          # 准星
│       ├── GameUI.tsx             # UI界面
│       ├── Bullet.tsx             # 子弹
│       ├── FPSWeapon.tsx          # 武器
│       ├── GameScene.tsx          # 场景
│       └── index.ts               # 导出
├── hooks/                         # 游戏hooks
├── utils/
│   ├── audioUtils.ts              # 音频工具
│   └── gameUtils.ts               # 游戏工具
└── page.tsx                       # 页面入口
```

#### 拼图游戏（架构已建立）

```
app/game/jigsaw-puzzle/
├── components/
│   ├── JigsawPuzzle.tsx           # 主组件
│   └── puzzle/
│       ├── Timer.tsx
│       ├── GameStats.tsx
│       ├── PuzzleBoard.tsx
│       ├── PuzzleSlot.tsx
│       └── index.ts
├── hooks/
│   └── useJigsawGame.ts           # 游戏逻辑hook
└── utils/
    ├── puzzleUtils.ts             # 拼图工具
    └── imageUtils.ts              # 图片工具
```

#### 2048游戏（架构已建立）

```
app/game/2048/
├── components/
│   ├── GameBoard.tsx
│   ├── DirectionControls.tsx
│   ├── AutoRunControls.tsx
│   └── index.ts
├── utils/
│   └── gameEngine.ts              # 核心算法
├── page.tsx                       # 主文件
└── store.ts
```

### 聊天模块

#### 状态管理（完全重构 ✅）

```
app/chat/
├── chatStore.ts                   # 保留（向后兼容）
└── stores/
    ├── messageStore.ts            # 消息管理
    ├── notificationStore.ts       # 通知管理
    ├── connectionStore.ts         # 连接管理
    ├── roomStore.ts               # 房间管理
    ├── userStore.ts               # 用户管理
    └── index.ts
```

#### 聊天组件（架构已建立）

```
app/chat/components/
├── ChatHeader.tsx                 # 主头部组件
├── OnlineUsers.tsx                # 主用户列表组件
├── header/
│   ├── DesktopHeader.tsx
│   ├── MobileHeader.tsx
│   └── index.ts
└── users/
    ├── UserSearchBar.tsx
    ├── UserFilters.tsx
    ├── userUtils.ts
    └── index.ts
```

### 其他模块

#### 搜索（架构已建立）

```
components/search/
├── SearchDialog.tsx               # 主组件
└── components/
    ├── SearchInput.tsx
    ├── SearchResultItem.tsx
    ├── CategoryFilter.tsx
    └── index.ts
```

#### 物品筛选（架构已建立）

```
app/thing/components/
├── ItemFilters.tsx                # 主组件
└── filters/
    ├── BasicFilters.tsx
    ├── DateRangePicker.tsx
    └── index.ts
```

#### WebSocket Hooks（架构已建立）

```
hooks/
├── useChatWebSocket.ts            # 主hook
└── chat-websocket/
    ├── useConnection.ts
    ├── useMessageHandling.ts
    └── index.ts
```

#### 语言检测（策略模式 ✅）

```
lib/i18n/
├── language-detection-service.ts  # 主服务
└── strategies/
    ├── BrowserLanguageStrategy.ts
    ├── GeolocationStrategy.ts
    ├── StoredPreferenceStrategy.ts
    └── index.ts
```

---

## 🔨 如何使用重构后的代码

### 1. 导入组件

#### 方式一：使用主组件（推荐）

```typescript
// 射击游戏
import ShootingGame from '@/app/game/shooting-range/components/ShootingGame'

// 使用
<ShootingGame difficulty="hard" />
```

#### 方式二：使用子组件

```typescript
// 导入特定组件
import { Target, Explosion, GameUI } from '@/app/game/shooting-range/components/game'

// 自定义使用
<Canvas>
  <Target position={[0,0,0]} hit={false} scale={1} onClick={handleClick} />
  <Explosion position={[0,0,0]} color="#ff0000" />
</Canvas>
```

### 2. 使用Store

#### 方式一：使用完整的chatStore（向后兼容）

```typescript
import useChatStore from '@/app/chat/chatStore'

// 使用
const { currentRoom, messages, onlineUsers } = useChatStore()
```

#### 方式二：使用独立的store（推荐）

```typescript
import { useMessageStore, useRoomStore, useUserStore } from '@/app/chat/stores'

// 只使用需要的store
const { messages, addMessage } = useMessageStore()
const { currentRoom, setCurrentRoom } = useRoomStore()
const { onlineUsers } = useUserStore()
```

### 3. 使用工具函数

```typescript
// 游戏工具
import {
  generateRandomPosition,
  difficultySettings,
} from '@/app/game/shooting-range/utils/gameUtils'

// 音频工具
import { playShotSound, playExplosionSound } from '@/app/game/shooting-range/utils/audioUtils'

// 拼图工具
import { initializePuzzlePieces, isGameComplete } from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

// 用户工具
import { isAdmin, getUserRole, formatJoinedDate } from '@/app/chat/components/users/userUtils'
```

### 4. 使用策略类

```typescript
import { BrowserLanguageStrategy, GeolocationStrategy } from '@/lib/i18n/strategies'

const browserStrategy = new BrowserLanguageStrategy()
const result = browserStrategy.detect()

if (result) {
  console.log(`检测到语言: ${result.language}, 置信度: ${result.confidence}`)
}
```

---

## 🔧 如何继续完善

### 完成拼图游戏主文件重构

1. 打开 `app/game/jigsaw-puzzle/components/JigsawPuzzle.tsx`
2. 使用已创建的组件和hooks重构主文件
3. 示例结构：

```typescript
import { Timer, GameStats, PuzzleBoard } from './puzzle'
import { useJigsawGame } from '../hooks/useJigsawGame'
import { getBackgroundSize, getBackgroundPosition } from '../utils/imageUtils'

export default function JigsawPuzzle({ imageUrl, size, onComplete }) {
  const {
    pieces,
    slots,
    startTime,
    isComplete,
    // ...其他状态
  } = useJigsawGame(size, imageUrl, puzzleSize, onComplete)

  return (
    <div>
      <GameStats {...stats} />
      <Timer startTime={startTime} isComplete={isComplete} />
      <PuzzleBoard
        size={size}
        slots={slots}
        pieces={pieces}
        // ...其他props
      />
    </div>
  )
}
```

### 完成其他组件的详细拆分

每个阶段都已建立了基础架构，你可以：

1. **参考射击游戏的完整拆分**
2. **使用已创建的工具和基础组件**
3. **逐步将主文件的功能移到子组件**

---

## 📊 代码质量检查

### 运行Linter

```bash
cd dogeow
npm run lint
```

### 运行测试

```bash
npm test
```

### 类型检查

```bash
npm run type-check
```

---

## 🎨 代码风格

所有新文件遵循以下风格：

1. **文件头部注释**: 说明文件用途
2. **导出规范**: 使用 named exports
3. **类型定义**: 使用 TypeScript 接口
4. **组件优化**: 使用 React.memo、useMemo、useCallback
5. **命名规范**:
   - 组件: PascalCase
   - 函数: camelCase
   - 常量: UPPER_SNAKE_CASE

---

## 🔍 调试技巧

### 查看组件层级

```typescript
// 在浏览器中
React DevTools -> Components Tab
```

### 查看状态变化

```typescript
// 在store中添加日志
useMessageStore.subscribe(state => {
  console.log('Messages updated:', state.messages)
})
```

### 性能分析

```typescript
// 使用 React Profiler
import { Profiler } from 'react'

<Profiler id="ShootingGame" onRender={callback}>
  <ShootingGame />
</Profiler>
```

---

## 📚 参考资源

- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Zustand 最佳实践](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [Three.js + React](https://docs.pmnd.rs/react-three-fiber)

---

## 💡 提示和技巧

1. **按需导入**: 只导入需要的组件，减少bundle size
2. **懒加载**: 对大组件使用动态import
3. **代码分割**: 利用Next.js的自动代码分割
4. **性能监控**: 使用React DevTools Profiler监控性能

---

**重构完成！🎉**

如有问题或需要进一步优化，请查看 `REFACTORING_COMPLETE.md` 了解详细信息。
