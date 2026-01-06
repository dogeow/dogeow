# 语音输入功能文档

## 概述

语音输入功能允许用户通过语音识别技术将语音转换为文本输入，适用于聊天和笔记编辑等场景。

## 技术实现

### 核心组件

1. **useVoiceInput Hook** (`hooks/useVoiceInput.ts`)
   - 封装了 Web Speech API（SpeechRecognition）
   - 提供语音识别的开始、停止、重置功能
   - 支持中文、英文、日文等多种语言
   - 实时返回识别结果（临时和最终结果）

2. **VoiceInputButton 组件** (`components/ui/voice-input-button.tsx`)
   - 可复用的语音输入按钮组件
   - 支持监听状态的视觉反馈
   - 内置 Tooltip 提示
   - 自动检测浏览器支持情况

### 使用场景

#### 1. 聊天消息输入

- 位置：`app/chat/components/MessageInput.tsx`
- 功能：点击麦克风按钮开始语音输入，识别的文本会自动添加到消息输入框
- 特性：支持多次语音输入，文本会自动追加

#### 2. 笔记标题输入

- 位置：`app/note/components/NoteEditor.tsx`
- 功能：在笔记标题输入框旁边的麦克风按钮开始语音输入
- 特性：识别的文本会自动填充到标题输入框

## 使用方法

### 基础用法

```typescript
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { VoiceInputButton } from '@/components/ui/voice-input-button'

function MyComponent() {
  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        // 处理最终识别结果
        console.log('识别完成:', text)
      }
    },
    language: 'zh-CN', // 设置识别语言
    continuous: false, // 是否持续监听
    interimResults: true, // 是否返回临时结果
  })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <VoiceInputButton
      isListening={isListening}
      isSupported={isSupported}
      onToggle={handleToggle}
    />
  )
}
```

### 高级配置

#### 支持的语言

- `zh-CN`: 简体中文
- `zh-TW`: 繁体中文
- `en-US`: 英语（美国）
- `ja-JP`: 日语
- `ko-KR`: 韩语
- 更多语言请参考 [Web Speech API 语言列表](https://cloud.google.com/speech-to-text/docs/languages)

#### Hook 选项

```typescript
interface UseVoiceInputOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  language?: string // 默认为 'zh-CN'
  continuous?: boolean // 是否持续监听，默认 false
  interimResults?: boolean // 是否返回临时结果，默认 true
}
```

#### 按钮组件属性

```typescript
interface VoiceInputButtonProps {
  isListening: boolean // 是否正在监听
  isSupported: boolean // 浏览器是否支持
  onToggle: () => void // 切换监听状态的回调
  disabled?: boolean // 是否禁用
  className?: string // 自定义样式
  size?: 'default' | 'sm' | 'lg' | 'icon' // 按钮大小
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' // 按钮变体
  showTooltip?: boolean // 是否显示工具提示
}
```

## 浏览器兼容性

### 支持的浏览器

- ✅ Chrome 33+
- ✅ Edge 79+
- ✅ Safari 14.1+（需要用户授权）
- ✅ Opera 20+

### 不支持的浏览器

- ❌ Firefox（截至目前未支持 Web Speech API）
- ❌ Internet Explorer

### 移动端支持

- ✅ Chrome for Android
- ✅ Safari for iOS 14.1+
- ✅ Samsung Internet

## 权限要求

使用语音输入需要用户授予麦克风权限。首次使用时，浏览器会弹出权限请求对话框。

## 错误处理

语音识别可能会遇到以下错误：

1. **no-speech**: 未检测到语音
2. **audio-capture**: 无法访问麦克风
3. **not-allowed**: 麦克风访问被拒绝
4. **network**: 网络错误
5. **aborted**: 识别被中止

所有错误都会通过 Toast 消息提示用户，并可以通过 `onError` 回调自定义处理。

## 用户体验优化

1. **视觉反馈**
   - 正在监听时按钮会显示红色并带有脉冲动画
   - 图标从麦克风切换为关闭麦克风

2. **提示信息**
   - Tooltip 显示当前状态和操作提示
   - 不支持的浏览器会显示禁用状态

3. **Toast 通知**
   - 开始监听：显示"开始语音识别..."
   - 停止监听：显示"语音识别已停止"
   - 错误情况：显示具体错误信息

## 测试

### 单元测试

已为以下组件编写测试：

- `hooks/__tests__/useVoiceInput.test.ts`
- `components/ui/__tests__/voice-input-button.test.tsx`

运行测试：

```bash
npm test useVoiceInput
npm test voice-input-button
```

### 手动测试清单

- [ ] 浏览器支持检测正常工作
- [ ] 麦克风权限请求正常显示
- [ ] 点击按钮可以开始/停止语音识别
- [ ] 识别的文本正确显示在输入框中
- [ ] 多次语音输入可以正常追加文本
- [ ] 错误情况有适当的提示信息
- [ ] 在不支持的浏览器中按钮显示禁用状态

## 未来改进

- [ ] 支持更多语言的自动检测
- [ ] 添加语音识别置信度显示
- [ ] 支持自定义唤醒词
- [ ] 添加语音识别历史记录
- [ ] 支持语音命令（如"发送消息"、"保存笔记"等）
- [ ] 优化移动端体验
- [ ] 添加离线语音识别支持

## 相关资源

- [Web Speech API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition 接口](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [浏览器兼容性表](https://caniuse.com/speech-recognition)

## 贡献

如有任何问题或建议，欢迎提交 Issue 或 Pull Request。
