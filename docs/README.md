# DogeOW 项目文档

欢迎查看 DogeOW 项目文档！这里包含了所有功能的详细说明和使用指南。

## 📚 文档导航

### 🎙️ 语音输入功能

最新添加的语音识别功能，支持在聊天和笔记中进行语音输入。

| 文档                                    | 描述                       | 适合人群    |
| --------------------------------------- | -------------------------- | ----------- |
| [快速开始](./voice-input-quickstart.md) | 5分钟快速上手指南          | ⭐ 新手推荐 |
| [完整文档](./voice-input.md)            | 详细的功能说明和API文档    | 开发者      |
| [使用示例](./voice-input-example.tsx)   | 实际应用场景的完整代码示例 | 开发者      |
| [实现总结](../VOICE_INPUT_SUMMARY.md)   | 功能实现的完整总结         | 项目管理者  |
| [更新日志](../CHANGELOG-voice-input.md) | 详细的更新记录             | 所有人      |

### 📋 项目功能

| 文档                      | 描述                     |
| ------------------------- | ------------------------ |
| [功能列表](./FEATURES.md) | 项目所有功能的列表和说明 |

### 🔧 开发指南

| 文档                      | 描述             |
| ------------------------- | ---------------- |
| [主 README](../README.md) | 技术栈和项目概述 |

## 🚀 快速链接

### 新手入门

1. 阅读 [主 README](../README.md) 了解项目技术栈
2. 查看 [功能列表](./FEATURES.md) 了解项目功能
3. 按照 [语音输入快速开始](./voice-input-quickstart.md) 体验最新功能

### 开发者指南

1. 克隆项目仓库
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm run dev`
4. 运行测试: `npm test`
5. 查看相关功能文档进行开发

### 测试指南

```bash
# 运行所有测试
npm test

# 运行语音输入测试
npm test useVoiceInput
npm test voice-input-button

# 查看测试覆盖率
npm run test:coverage

# 监听模式（开发时使用）
npm run test:watch
```

## 📦 项目结构

```
dogeow/
├── app/                          # Next.js 应用目录
│   ├── chat/                     # 聊天功能
│   ├── note/                     # 笔记功能
│   ├── file/                     # 文件管理
│   ├── game/                     # 游戏模块
│   └── ...
├── components/                   # React 组件
│   ├── ui/                       # UI 基础组件
│   │   ├── voice-input-button.tsx  # 语音输入按钮
│   │   └── ...
│   └── ...
├── hooks/                        # 自定义 Hooks
│   ├── useVoiceInput.ts          # 语音输入 Hook
│   └── ...
├── lib/                          # 工具库
│   ├── api/                      # API 客户端
│   ├── i18n/                     # 国际化
│   └── ...
├── docs/                         # 项目文档 (本目录)
│   ├── README.md                 # 文档索引 (本文件)
│   ├── FEATURES.md               # 功能列表
│   ├── voice-input.md            # 语音输入完整文档
│   ├── voice-input-quickstart.md # 语音输入快速开始
│   └── voice-input-example.tsx   # 语音输入示例
└── ...
```

## 🎯 功能特性

### 已实现功能

- ✅ 语音输入支持（2026-01-06）
- ✅ 聊天功能
- ✅ 笔记功能
- ✅ 文件管理
- ✅ 游戏模块
- ✅ 物品管理
- ✅ 工具集合

### 计划中功能

- ⏳ 更多语音识别优化
- ⏳ 实时协作编辑
- ⏳ 插件系统
- ⏳ 更多实用工具

查看 [功能列表](./FEATURES.md) 了解所有功能详情。

## 💡 最佳实践

### 代码规范

- ✅ TypeScript 严格模式
- ✅ ESLint 代码检查
- ✅ Prettier 代码格式化
- ✅ Git hooks (Husky)
- ✅ 单元测试覆盖

### 组件开发

- 使用 TypeScript 定义清晰的类型
- 编写单元测试
- 添加必要的文档注释
- 考虑国际化支持
- 优化性能和用户体验

### 文档编写

- 提供清晰的使用示例
- 说明浏览器兼容性
- 记录已知问题和限制
- 保持文档更新

## 🔗 相关链接

### 官方资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)

### Web API 参考

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

### 开发工具

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)

## 📮 反馈与贡献

如果您有任何问题、建议或发现了 Bug：

- 提交 Issue
- 创建 Pull Request
- 联系项目维护者

## 📄 许可证

请查看项目根目录的 LICENSE 文件。

---

**最后更新**: 2026-01-06  
**文档版本**: v1.0.0

如有任何疑问，欢迎随时提问！
