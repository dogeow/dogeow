# 多语言支持 - 语言文件结构

本项目使用类似 Laravel 的语言文件结构来组织多语言翻译。

## 目录结构

```
lib/i18n/
├── langs/                    # 语言文件目录
│   ├── zh_CN.ts            # 简体中文
│   ├── zh_TW.ts            # 繁体中文
│   ├── en.ts               # 英文
│   ├── ja.ts               # 日文
│   └── index.ts            # 语言文件导出索引
├── translations.ts          # 主翻译文件（兼容性保持）
└── index.ts                # 主模块导出
```

## 语言文件格式

每个语言文件都导出一个包含所有翻译键值对的对象：

```typescript
export const zh_CN = {
  'app.title': 'Doge先锋',
  'nav.thing': '物品管理',
  // ... 更多翻译
}
```

## 添加新语言

1. 在 `langs/` 目录下创建新的语言文件（例如 `ko.ts`）
2. 导出包含所有翻译的对象
3. 在 `langs/index.ts` 中添加导出
4. 在 `translations.ts` 中添加到主翻译对象
5. 在 `SUPPORTED_LANGUAGES` 数组中添加语言信息

## 使用方式

```typescript
// 导入特定语言
import { zh_CN, en } from './langs'

// 导入所有语言
import { translations } from './translations'

// 导入支持的语言列表
import { SUPPORTED_LANGUAGES } from './langs'
```

## 优势

- **模块化**: 每种语言独立管理，便于维护
- **类型安全**: TypeScript 提供完整的类型检查
- **易于扩展**: 添加新语言只需创建新文件
- **Laravel 风格**: 熟悉的结构，便于团队协作
- **向后兼容**: 保持现有代码的兼容性
