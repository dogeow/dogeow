'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface WordDataEditorProps {
  wordContent: string
  initialData?: {
    phonetic_us?: string
    explanation?: string
    example_sentences?: Array<{ en: string; zh: string }>
  }
  onSave: (data: {
    phonetic_us: string
    explanation: string
    example_sentences: Array<{ en: string; zh: string }>
  }) => Promise<void>
  saveButtonText?: string
}

export function WordDataEditor({
  wordContent,
  initialData,
  onSave,
  saveButtonText = '保存',
}: WordDataEditorProps) {
  const [phonetic, setPhonetic] = useState(initialData?.phonetic_us || '')
  const [explanation, setExplanation] = useState(initialData?.explanation || '')
  const [examples, setExamples] = useState(
    initialData?.example_sentences?.map(e => `${e.en}\n${e.zh}`).join('\n\n') || ''
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const generateData = async () => {
    setIsGenerating(true)
    try {
      const prompt = `请帮我生成这个英语单词的数据：

单词: ${wordContent}
当前音标: ${phonetic || '(无)'}
当前释义: ${explanation || '(无)'}
当前例句: ${initialData?.example_sentences?.map(e => e.en).join('; ') || '(无)'}

请严格按以下格式返回（不要有其他内容）：
【音标】/音标内容/
【释义】(完整的中文释义，包含词性)
【例句1】英文句子
【翻译1】中文翻译
【例句2】英文句子
【翻译2】中文翻译`

      const body = {
        useChat: true,
        messages: [{ role: 'user' as const, content: prompt }],
        command: '你是一个英语学习助手。请严格按照用户要求的格式返回数据。',
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('生成失败')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = new TextDecoder().decode(value)
        const lines = text.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const match = line.match(/^0:"(.*)"$/)
            if (match) {
              content += match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
            }
          }
        }
      }

      // 解析音标
      const phoneticMatch = content.match(/【音标】\s*\/?([^/\n]+)\/?/)
      if (phoneticMatch) {
        setPhonetic(phoneticMatch[1].trim())
      }

      // 解析释义
      const explanationMatch = content.match(/【释义】([\s\S]+?)(?=【例句|$)/)
      if (explanationMatch) {
        setExplanation(explanationMatch[1].trim())
      }

      // 解析例句
      const examplesList: string[] = []
      const exampleMatches = content.matchAll(
        /【例句\d+】([\s\S]+?)【翻译\d+】([\s\S]+?)(?=【例句|$)/g
      )
      for (const m of exampleMatches) {
        examplesList.push(`${m[1].trim()}\n${m[2].trim()}`)
      }
      if (examplesList.length > 0) {
        setExamples(examplesList.join('\n\n'))
      }

      toast.success('数据已生成，请检查后保存')
    } catch (error) {
      console.error('生成数据失败:', error)
      toast.error('生成数据失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!explanation.trim()) {
      toast.error('请填写中文释义')
      return
    }

    setIsSaving(true)
    try {
      const examplePairs = examples
        .split('\n\n')
        .filter(p => p.trim())
        .map(pair => {
          const lines = pair.split('\n').filter(l => l.trim())
          return {
            en: lines[0] || '',
            zh: lines[1] || '',
          }
        })
        .filter(e => e.en)

      await onSave({
        phonetic_us: phonetic.trim(),
        explanation: explanation.trim(),
        example_sentences: examplePairs,
      })

      toast.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('保存失败')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="text-primary h-5 w-5" />
          单词：{wordContent}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 生成按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={generateData}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI 生成中...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              AI 生成数据
            </>
          )}
        </Button>

        {/* 音标 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">音标（美式）</label>
          <Input
            value={phonetic}
            onChange={e => setPhonetic(e.target.value)}
            placeholder="例如: ˈeksəmpəl"
          />
        </div>

        {/* 中文释义 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            中文释义 <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="输入中文释义..."
            className="min-h-[100px]"
          />
        </div>

        {/* 例句 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">例句（英文换行+中文，空行分隔多组）</label>
          <Textarea
            value={examples}
            onChange={e => setExamples(e.target.value)}
            placeholder={`He is a good student.\n他是一个好学生。\n\nShe works hard.\n她努力工作。`}
            className="min-h-[150px]"
          />
        </div>

        {/* 保存按钮 */}
        <Button onClick={handleSave} disabled={isSaving || isGenerating} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {saveButtonText}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
