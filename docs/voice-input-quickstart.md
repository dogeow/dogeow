# 语音输入功能快速开始

## 🚀 5 分钟快速上手

### 1. 最简单的使用方式

```tsx
import { useState } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { VoiceInputButton } from '@/components/ui/voice-input-button'
import { Input } from '@/components/ui/input'

function MyComponent() {
  const [text, setText] = useState('')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setText(prev => (prev ? `${prev} ${transcript}` : transcript))
      }
    },
  })

  const handleToggle = () => {
    isListening ? stopListening() : startListening()
  }

  return (
    <div className="flex gap-2">
      <Input value={text} onChange={e => setText(e.target.value)} />
      <VoiceInputButton
        isListening={isListening}
        isSupported={isSupported}
        onToggle={handleToggle}
      />
    </div>
  )
}
```

### 2. 支持的语言

只需修改 `language` 参数：

```tsx
// 中文
useVoiceInput({ language: 'zh-CN' })

// 英文
useVoiceInput({ language: 'en-US' })

// 日文
useVoiceInput({ language: 'ja-JP' })
```

### 3. 查看临时识别结果

```tsx
const { transcript, interimTranscript } = useVoiceInput({
  interimResults: true, // 启用临时结果
})

// 显示时结合两者
const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '')
```

### 4. 连续识别模式

```tsx
useVoiceInput({
  continuous: true, // 持续监听，不会自动停止
})
```

### 5. 错误处理

```tsx
const { error } = useVoiceInput({
  onError: errorMessage => {
    console.error('语音识别错误:', errorMessage)
    // 自定义错误处理
  },
})

// 显示错误
{
  error && <div className="text-red-500">{error}</div>
}
```

## 📱 实际应用场景

### 场景 1: 搜索框

```tsx
function SearchBar() {
  const [query, setQuery] = useState('')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setQuery(text)
        // 自动搜索
        performSearch(text)
      }
    },
  })

  return (
    <div className="flex gap-2">
      <Input
        placeholder="搜索或说出关键词..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <VoiceInputButton
        isListening={isListening}
        isSupported={isSupported}
        onToggle={() => (isListening ? stopListening() : startListening())}
      />
    </div>
  )
}
```

### 场景 2: 评论框

```tsx
function CommentBox() {
  const [comment, setComment] = useState('')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setComment(prev => (prev ? `${prev}\n${text}` : text))
      }
    },
  })

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="写下你的评论或使用语音输入..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={5}
      />
      <div className="flex justify-end">
        <VoiceInputButton
          isListening={isListening}
          isSupported={isSupported}
          onToggle={() => (isListening ? stopListening() : startListening())}
        />
      </div>
    </div>
  )
}
```

### 场景 3: 多字段表单

```tsx
function ContactForm() {
  const [activeField, setActiveField] = useState<'name' | 'message' | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal && activeField) {
        if (activeField === 'name') {
          setName(prev => (prev ? `${prev} ${text}` : text))
        } else if (activeField === 'message') {
          setMessage(prev => (prev ? `${prev} ${text}` : text))
        }
      }
    },
  })

  const handleVoiceToggle = (field: 'name' | 'message') => {
    if (isListening && activeField === field) {
      stopListening()
      setActiveField(null)
    } else {
      setActiveField(field)
      startListening()
    }
  }

  return (
    <form className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="姓名" value={name} onChange={e => setName(e.target.value)} />
        <VoiceInputButton
          isListening={isListening && activeField === 'name'}
          isSupported={isSupported}
          onToggle={() => handleVoiceToggle('name')}
        />
      </div>

      <div className="space-y-2">
        <Textarea placeholder="留言" value={message} onChange={e => setMessage(e.target.value)} />
        <VoiceInputButton
          isListening={isListening && activeField === 'message'}
          isSupported={isSupported}
          onToggle={() => handleVoiceToggle('message')}
        />
      </div>
    </form>
  )
}
```

## 🎨 按钮样式定制

```tsx
// 不同尺寸
<VoiceInputButton size="sm" {...props} />
<VoiceInputButton size="default" {...props} />
<VoiceInputButton size="lg" {...props} />
<VoiceInputButton size="icon" {...props} />

// 不同样式
<VoiceInputButton variant="default" {...props} />
<VoiceInputButton variant="outline" {...props} />
<VoiceInputButton variant="ghost" {...props} />
<VoiceInputButton variant="secondary" {...props} />

// 自定义类名
<VoiceInputButton className="custom-class" {...props} />

// 隐藏 Tooltip
<VoiceInputButton showTooltip={false} {...props} />
```

## ⚠️ 常见问题

### 1. 为什么按钮是禁用的？

可能的原因：

- 浏览器不支持 Web Speech API（如 Firefox）
- 未使用 HTTPS（除了 localhost）
- 设置了 `disabled={true}`

### 2. 为什么点击后没反应？

可能的原因：

- 用户拒绝了麦克风权限
- 麦克风被其他应用占用
- 网络连接问题（语音识别需要网络）

### 3. 识别不准确怎么办？

建议：

- 确保环境安静
- 说话清晰
- 使用质量好的麦克风
- 检查 `language` 设置是否正确

### 4. 如何在生产环境使用？

要求：

- ✅ 必须使用 HTTPS
- ✅ 用户必须授权麦克风权限
- ✅ 网络连接稳定

## 🔧 调试技巧

### 查看识别状态

```tsx
const voice = useVoiceInput({
  onTranscript: (text, isFinal) => {
    console.log('识别中:', text, '是否完成:', isFinal)
  },
  onError: error => {
    console.error('错误:', error)
  },
})

console.log('是否支持:', voice.isSupported)
console.log('是否监听:', voice.isListening)
console.log('最终文本:', voice.transcript)
console.log('临时文本:', voice.interimTranscript)
console.log('错误信息:', voice.error)
```

### 测试浏览器支持

```tsx
if (typeof window !== 'undefined') {
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  console.log('浏览器支持语音识别:', isSupported)
}
```

## 📚 进一步学习

- [完整文档](./voice-input.md) - 详细的 API 文档和高级用法
- [使用示例](./voice-input-example.tsx) - 更多实际场景示例
- [更新日志](../CHANGELOG-voice-input.md) - 查看所有更改

## 💡 提示

1. **首次使用**: 浏览器会请求麦克风权限，请选择"允许"
2. **HTTPS 要求**: 生产环境必须使用 HTTPS
3. **网络连接**: 语音识别需要网络连接
4. **环境声音**: 在安静的环境中识别效果更好
5. **语言设置**: 确保选择正确的识别语言

## 🎯 最佳实践

1. **提供视觉反馈**: 使用 `isListening` 状态显示录音提示
2. **错误处理**: 始终处理 `onError` 回调
3. **用户引导**: 首次使用时提示用户授权麦克风
4. **备用方案**: 保留键盘输入选项
5. **测试覆盖**: 在不同浏览器中测试功能

---

**需要帮助？** 查看 [完整文档](./voice-input.md) 或提交 Issue。
