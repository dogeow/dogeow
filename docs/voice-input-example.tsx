/**
 * 语音输入功能使用示例
 *
 * 这个文件展示了如何在不同场景下使用语音输入功能
 */

'use client'

import { useState } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { VoiceInputButton } from '@/components/ui/voice-input-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// 示例 1: 基础输入框集成
export function BasicInputExample() {
  const [text, setText] = useState('')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setText(prev => (prev ? `${prev} ${transcript}` : transcript))
      }
    },
    language: 'zh-CN',
  })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>基础语音输入示例</CardTitle>
        <CardDescription>在输入框中使用语音输入</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="说点什么..."
            className="flex-1"
          />
          <VoiceInputButton
            isListening={isListening}
            isSupported={isSupported}
            onToggle={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// 示例 2: 多行文本框集成
export function TextareaExample() {
  const [text, setText] = useState('')

  const { isSupported, isListening, interimTranscript, startListening, stopListening } =
    useVoiceInput({
      onTranscript: (transcript, isFinal) => {
        if (isFinal) {
          setText(prev => (prev ? `${prev}\n${transcript}` : transcript))
        }
      },
      language: 'zh-CN',
      continuous: false,
      interimResults: true,
    })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // 显示文本 + 临时识别结果
  const displayText = text + (interimTranscript ? ` ${interimTranscript}` : '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>多行文本框示例</CardTitle>
        <CardDescription>支持临时识别结果显示</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Textarea
            value={displayText}
            onChange={e => setText(e.target.value)}
            placeholder="使用语音输入你的想法..."
            rows={5}
          />
          <div className="flex justify-end">
            <VoiceInputButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={handleToggle}
            />
          </div>
          {isListening && (
            <p className="text-muted-foreground animate-pulse text-sm">正在监听... 请说话</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 示例 3: 多语言支持
export function MultiLanguageExample() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('zh-CN')

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setText(prev => (prev ? `${prev} ${transcript}` : transcript))
      }
    },
    language,
  })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>多语言语音输入示例</CardTitle>
        <CardDescription>支持多种语言的语音识别</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="rounded-md border px-3 py-2"
              disabled={isListening}
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁体中文</option>
              <option value="en-US">English (US)</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="选择语言后开始说话..."
              className="flex-1"
            />
            <VoiceInputButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={handleToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 示例 4: 表单集成
export function FormExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [activeField, setActiveField] = useState<'name' | 'message' | null>(null)

  const { isSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal && activeField) {
        setFormData(prev => ({
          ...prev,
          [activeField]: prev[activeField] ? `${prev[activeField]} ${transcript}` : transcript,
        }))
      }
    },
    language: 'zh-CN',
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
    <Card>
      <CardHeader>
        <CardTitle>表单语音输入示例</CardTitle>
        <CardDescription>在表单字段中使用语音输入</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">姓名</label>
            <div className="flex gap-2">
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入或说出你的姓名"
                className="flex-1"
              />
              <VoiceInputButton
                isListening={isListening && activeField === 'name'}
                isSupported={isSupported}
                onToggle={() => handleVoiceToggle('name')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱</label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="输入你的邮箱"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">留言</label>
            <div className="space-y-2">
              <Textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="输入或说出你的留言"
                rows={4}
              />
              <div className="flex justify-end">
                <VoiceInputButton
                  isListening={isListening && activeField === 'message'}
                  isSupported={isSupported}
                  onToggle={() => handleVoiceToggle('message')}
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 主展示组件
export default function VoiceInputExamples() {
  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">语音输入功能示例</h1>
        <p className="text-muted-foreground">展示语音输入功能在不同场景下的使用方法</p>
      </div>

      <BasicInputExample />
      <TextareaExample />
      <MultiLanguageExample />
      <FormExample />
    </div>
  )
}
