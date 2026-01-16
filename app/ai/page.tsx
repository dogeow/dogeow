'use client'

import { useState, useCallback } from 'react'
import { useCompletion } from 'ai/react'
import { Sparkles, Send, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/novel-editor/ui/scroll-area'
import MarkdownPreview from '@/components/novel-editor/markdown-preview'

const AI_COMMAND = '请作为AI助理回答用户问题，中文优先，必要时给出步骤和示例。'

export default function AiPage() {
  const [prompt, setPrompt] = useState('')

  const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
    api: '/api/generate',
    onResponse: response => {
      if (response.status === 429) {
        toast.error('今日请求已达上限，请稍后再试')
      }
    },
    onError: error => {
      console.error('AI API Error:', error)
      toast.error(error.message)
    },
  })

  const handleSend = useCallback(async () => {
    const text = prompt.trim()
    if (!text) {
      toast.error('请输入内容')
      return
    }
    try {
      await complete(text, {
        body: {
          option: 'zap',
          command: AI_COMMAND,
          text,
        },
      })
    } catch {
      // 交由 onError 处理
    }
  }, [complete, prompt])

  const handleClear = useCallback(() => {
    setPrompt('')
    setCompletion('')
  }, [setCompletion])

  return (
    <main className="container mx-auto max-w-5xl px-3 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">AI 助理</h1>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-background rounded-lg border p-4 shadow-sm">
          <label htmlFor="ai-prompt" className="mb-2 block text-sm font-medium">
            你的需求
          </label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            placeholder="例如：帮我写一份周报，包含工作内容、问题与计划。"
            className="min-h-[140px]"
            onKeyDown={event => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={handleSend} disabled={isLoading || !prompt.trim()}>
              <Send className="mr-2 h-4 w-4" />
              发送
            </Button>
            {isLoading ? (
              <Button variant="outline" onClick={stop}>
                <Square className="mr-2 h-4 w-4" />
                停止
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClear} disabled={!prompt && !completion}>
                <Trash2 className="mr-2 h-4 w-4" />
                清空
              </Button>
            )}
            <span className="text-muted-foreground text-xs">Ctrl/Cmd + Enter 发送</span>
          </div>
        </div>

        <div className="bg-background rounded-lg border p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">AI 输出</h2>
            <span className="text-muted-foreground text-xs">
              {isLoading ? '生成中...' : completion ? '已完成' : '等待输入'}
            </span>
          </div>
          <ScrollArea className="bg-muted/20 h-[360px] w-full rounded-md border p-3">
            {completion ? (
              <MarkdownPreview content={completion} />
            ) : (
              <p className="text-muted-foreground text-sm">输入问题后点击发送即可生成内容。</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </main>
  )
}
