'use client'

import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Word } from '../types'
import {
  Loader2,
  Send,
  Save,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Edit,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'

interface WordAIDialogProps {
  word: Word
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function WordAIDialog({ word, open, onOpenChange }: WordAIDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [editedExplanation, setEditedExplanation] = useState(word.explanation?.zh || '')
  const [editedExamples, setEditedExamples] = useState(
    word.example_sentences?.map(e => `${e.en}\n${e.zh}`).join('\n\n') || ''
  )
  const [autoQueryDone, setAutoQueryDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 重置状态
  useEffect(() => {
    if (open) {
      setMessages([])
      setErrorMessage(null)
      setCopiedIdx(null)
      setAutoQueryDone(false)
      setEditedExplanation(word.explanation?.zh || '')
      setEditedExamples(word.example_sentences?.map(e => `${e.en}\n${e.zh}`).join('\n\n') || '')
    }
  }, [open, word])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 复制消息内容
  const copyMessage = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIdx(idx)
      toast.success('已复制')
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  // 发送消息给 AI
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    setErrorMessage(null)
    const userMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const chatMessages = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ]

      const body = {
        useChat: true,
        messages: chatMessages,
        command: '你是一个英语学习助手，帮助用户学习英语单词。请用中文回答。',
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        let message = 'AI 请求失败'
        try {
          const data = text ? JSON.parse(text) : {}
          if (typeof data?.error === 'string') message = data.error
        } catch {
          if (text.trim()) message = text.trim()
        }
        throw new Error(message)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      let assistantContent = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            if (line.startsWith('0:')) {
              const match = line.match(/^0:"(.*)"$/)
              if (match) {
                const decodedContent = match[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\r/g, '\r')
                  .replace(/\\t/g, '\t')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\')
                assistantContent += decodedContent
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  }
                  return newMessages
                })
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      console.error('AI 请求失败:', error)
      const apiMsg = error instanceof Error ? error.message : ''
      const toShow =
        typeof apiMsg === 'string' && apiMsg && apiMsg !== 'AI 请求失败'
          ? apiMsg
          : 'AI 请求失败，请稍后重试'
      setErrorMessage(toShow)
      toast.error(toShow)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  // 自动查询单词解释
  useEffect(() => {
    if (open && !autoQueryDone && !isLoading) {
      setAutoQueryDone(true)
      const prompt = `请详细解释英语单词 "${word.content}" 的含义、用法、词性、常见搭配和例句。请用中文回答。`
      sendMessage(prompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoQueryDone, isLoading])

  // AI 生成数据
  const generateData = async () => {
    setIsGenerating(true)
    try {
      const prompt = `请帮我生成这个英语单词的数据：

单词: ${word.content}
当前释义: ${word.explanation?.zh || '(无)'}
当前例句: ${word.example_sentences?.map(e => e.en).join('; ') || '(无)'}

请严格按以下格式返回（不要有其他内容）：
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

      // 解析生成的内容
      const explanationMatch = content.match(/【释义】(.+?)(?=【例句|$)/s)
      if (explanationMatch) {
        setEditedExplanation(explanationMatch[1].trim())
      }

      const examples: string[] = []
      const exampleMatches = content.matchAll(/【例句\d+】(.+?)【翻译\d+】(.+?)(?=【例句|$)/gs)
      for (const m of exampleMatches) {
        examples.push(`${m[1].trim()}\n${m[2].trim()}`)
      }
      if (examples.length > 0) {
        setEditedExamples(examples.join('\n\n'))
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
    setIsSaving(true)
    try {
      const examplePairs = editedExamples
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/word/${word.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          explanation: {
            zh: editedExplanation,
            en: word.explanation?.en || '',
          },
          example_sentences: examplePairs,
        }),
      })

      if (!response.ok) throw new Error('保存失败')

      toast.success('单词数据已更新')
      mutate('/api/word/learn/daily')
      onOpenChange(false)
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b p-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="text-primary h-4 w-4" />
            AI 学习 - {word.content}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="chat" className="text-xs">
              <MessageSquare className="mr-1 h-3 w-3" />
              AI 对话
            </TabsTrigger>
            <TabsTrigger value="edit" className="text-xs">
              <Edit className="mr-1 h-3 w-3" />
              编辑数据
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0 flex flex-1 flex-col overflow-hidden p-4 pt-2">
            {/* 对话区域 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-lg border p-2">
              {errorMessage && (
                <div className="border-destructive/50 bg-destructive/10 text-destructive mb-2 rounded-lg border p-2 text-xs">
                  {errorMessage}
                </div>
              )}
              {messages.length === 0 && !errorMessage ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`group relative text-xs ${
                        msg.role === 'user'
                          ? 'bg-primary/10 ml-6 rounded-lg p-2'
                          : 'bg-muted mr-6 rounded-lg p-2'
                      }`}
                    >
                      <p className="pr-6 break-words whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && msg.content && (
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.content, idx)}
                          className="hover:bg-background/50 absolute top-1.5 right-1.5 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          title="复制"
                        >
                          {copiedIdx === idx ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="text-muted-foreground h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      正在思考...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 输入框 */}
            <div className="mt-2 flex shrink-0 gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="输入问题..."
                className="h-[40px] min-h-[40px] resize-none text-xs"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[40px] w-[40px] shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="m-0 flex-1 overflow-y-auto p-4 pt-2">
            <div className="space-y-3">
              {/* AI 生成按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={generateData}
                disabled={isGenerating}
                className="w-full text-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    AI 生成数据
                  </>
                )}
              </Button>

              <div className="space-y-1">
                <label className="text-xs font-medium">中文释义</label>
                <Textarea
                  value={editedExplanation}
                  onChange={e => setEditedExplanation(e.target.value)}
                  placeholder="输入中文释义..."
                  className="min-h-[80px] resize-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">例句（英文换行+中文，空行分隔多组）</label>
                <Textarea
                  value={editedExamples}
                  onChange={e => setEditedExamples(e.target.value)}
                  placeholder={`He is a good student.\n他是一个好学生。\n\nShe works hard.\n她努力工作。`}
                  className="min-h-[120px] resize-none text-xs"
                />
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full" size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-3 w-3" />
                    保存修改
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
