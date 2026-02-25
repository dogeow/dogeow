'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Image as ImageIcon, X, Send, Square, Loader2, Upload, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/helpers'
import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 单张图片：本地预览 + 上传后的 URL */
interface ImageItem {
  id: string
  preview: string
  url?: string
  uploading?: boolean
}

interface VisionAiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VisionAiDialog({ open, onOpenChange }: VisionAiDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasMessages = messages.length > 0

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, completion, isLoading])

  // 关闭时清理（撤销 blob URL）
  useEffect(() => {
    if (!open) {
      setPrompt('')
      setCompletion('')
      setImages(prev => {
        prev.forEach(item => {
          if (item.preview.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview)
          }
        })
        return []
      })
    }
  }, [open])

  // 上传单张图片到后端（又拍云），与 /api/upload/images 一致传二进制
  const uploadImageToServer = useCallback(async (file: File): Promise<string> => {
    const token = useAuthStore.getState().token
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/api/vision/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || '图片上传失败')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || '图片上传失败')
    }

    return data.url
  }, [])

  // 选择文件后：先加入列表（预览），再立即上传到后端（二进制）
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      const remainingSlots = 5 - images.length

      if (imageFiles.length > remainingSlots) {
        toast.warning(`最多只能上传 ${remainingSlots} 张图片`)
      }

      const filesToProcess = imageFiles.slice(0, remainingSlots)

      filesToProcess.forEach(file => {
        const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const preview = URL.createObjectURL(file)
        setImages(prev => [...prev, { id, preview, uploading: true }])

        uploadImageToServer(file)
          .then(url => {
            setImages(prev =>
              prev.map(item => (item.id === id ? { ...item, url, uploading: false } : item))
            )
          })
          .catch(err => {
            URL.revokeObjectURL(preview)
            toast.error(err instanceof Error ? err.message : '图片上传失败')
            setImages(prev => prev.filter(item => item.id !== id))
          })
      })
    },
    [images.length, uploadImageToServer]
  )

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  // 移除图片（撤销 blob URL 避免内存泄漏）
  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const item = prev[index]
      if (item?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // 停止生成
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setCompletion('')
  }, [])

  // 清除对话
  const handleClear = useCallback(() => {
    stop()
    setMessages([])
    setCompletion('')
    setPrompt('')
    setImages([])
  }, [stop])

  // 发送消息（使用已上传的图片 URL）
  const handleSend = useCallback(async () => {
    const imageUrls = images.map(i => i.url).filter((u): u is string => !!u)
    const hasReadyImages = imageUrls.length > 0
    const stillUploading = images.some(i => i.uploading)

    if (!prompt.trim() && !hasReadyImages) return
    if (hasReadyImages && stillUploading) {
      toast.warning('图片上传中，请稍候')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim() || '请描述这张图片',
    }

    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setPrompt('')
    setIsLoading(true)
    setCompletion('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useChat: true,
          messages: [
            {
              role: 'user',
              content: userMessage.content,
            },
          ],
          images: imageUrls,
          provider: 'zhipuai',
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        // 尝试读取后端返回的错误信息
        let errorDetail = `API error: ${response.status}`
        try {
          const errorData = await response.json()
          errorDetail = errorData.error || JSON.stringify(errorData)
        } catch {
          // 如果不是 JSON，尝试读取文本
          try {
            errorDetail = await response.text()
          } catch {
            // 忽略
          }
        }
        throw new Error(errorDetail)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 读取流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          // 处理内容块: 0:"content"
          if (line.startsWith('0:')) {
            try {
              const content = JSON.parse(line.slice(2))
              accumulatedContent += content
              setCompletion(accumulatedContent)
            } catch (e) {
              console.warn('Failed to parse content chunk:', line)
            }
          }

          // 处理完成标记: d:{metadata}
          if (line.startsWith('d:')) {
            try {
              if (accumulatedContent) {
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: accumulatedContent,
                  },
                ])
              }
              setCompletion('')
              setIsLoading(false)
              return
            } catch (e) {
              console.warn('Failed to parse metadata:', line)
            }
          }
        }
      }

      // 流结束，添加 assistant 消息
      if (accumulatedContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: accumulatedContent,
          },
        ])
      }
      setCompletion('')
      setIsLoading(false)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      console.error('Vision AI error:', error)

      // 解析错误信息，提取具体错误描述
      let errorMessage = 'AI服务发生未知错误'
      if (error instanceof Error) {
        const msg = error.message
        // 处理 fetch 网络错误
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
          errorMessage = 'AI服务暂时不可用，请检查网络连接或配置'
        }
        // 处理 API 返回的错误（如 429 Rate Limit、500 Server Error 等）
        else if (msg.includes('API (')) {
          // 尝试提取 JSON 中的 message
          const jsonMatch = msg.match(/\{[^}]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              errorMessage = parsed.message || parsed.error?.message || msg
            } catch {
              // JSON 解析失败，尝试从原始消息中提取
              const msgMatch = msg.match(/"message":"([^"]+)"/)
              errorMessage = msgMatch ? msgMatch[1] : msg
            }
          } else {
            // 没有 JSON，直接显示原始消息
            errorMessage = msg
          }
        } else {
          errorMessage = msg
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `错误: ${errorMessage}`,
        },
      ])
      setCompletion('')
      setIsLoading(false)
    } finally {
      abortControllerRef.current = null
    }
  }, [prompt, messages, images])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !top-1/2 !left-1/2 flex h-[90vh] max-h-[90vh] w-full max-w-4xl !-translate-x-1/2 !-translate-y-1/2 flex-col gap-0 p-0">
        <DialogHeader className="flex-none border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <ImageIcon className="h-5 w-5 text-blue-500" aria-hidden />
              AI 视觉理解
            </DialogTitle>
            {hasMessages && (
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
                <Trash2 className="mr-1 h-4 w-4" />
                清空
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading && !completion && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-4">
                <ImageIcon className="h-12 w-12 text-primary" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold">AI 视觉理解</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                上传图片或截图，AI
                将分析图片内容并回答你的问题。支持发票识别、文档解析、物品识别等多种场景。
              </p>

              {/* 图片上传区域 */}
              <div
                className={cn(
                  'w-full max-w-md cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  images.length >= 5 && 'pointer-events-none opacity-50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileSelect(e.target.files)}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="text-muted-foreground h-8 w-8" />
                  <p className="text-sm font-medium">
                    {images.length >= 5 ? '已达到最大图片数量' : '点击或拖拽图片到这里'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    支持 JPG、PNG、GIF、WebP（最多5张）
                  </p>
                </div>
              </div>

              {/* 已上传图片预览 */}
              {images.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {images.map((item, index) => (
                    <div key={item.id} className="group relative">
                      <Image
                        src={item.preview}
                        alt={`上传的图片 ${index + 1}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                      {item.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 对话消息 */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('mb-4 flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* 加载中的响应 */}
          {(isLoading || completion) && (
            <div className="mb-4 flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                <p className="whitespace-pre-wrap">{completion}</p>
                {isLoading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 正在思考...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 上传的图片预览（对话中） */}
          {images.length > 0 && hasMessages && (
            <div className="mb-4 flex flex-wrap gap-2">
              {images.map((item, index) => (
                <div key={item.id} className="group relative">
                  <Image
                    src={item.preview}
                    alt={`上传的图片 ${index + 1}`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="flex-none border-t p-2">
          {/* 图片上传区域（小） */}
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((item, index) => (
                <div key={item.id} className="group relative">
                  <Image
                    src={item.preview}
                    alt={`上传的图片 ${index + 1}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50"
                >
                  <Upload className="text-muted-foreground h-6 w-6" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFileSelect(e.target.files)}
              />
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* 如果没有图片，显示上传按钮 */}
            {images.length === 0 && (
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-5 w-5" />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFileSelect(e.target.files)}
            />
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={images.length > 0 ? '询问关于图片的问题...' : '输入消息或上传图片...'}
              className="max-h-[80px] min-h-[48px] resize-none py-2.5"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault()
                  if ((prompt.trim() || images.length > 0) && !isLoading) {
                    handleSend()
                  }
                }
              }}
              disabled={isLoading}
              rows={1}
            />
            <Button
              onClick={isLoading ? stop : handleSend}
              disabled={isLoading ? false : !prompt.trim() && images.length === 0}
              size="icon"
              className="h-12 w-12 shrink-0"
            >
              {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
