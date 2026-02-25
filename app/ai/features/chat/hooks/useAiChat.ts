'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AI_SYSTEM_PROMPT, type ChatMessage } from '../types'
import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'

// AI 提供商类型
type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

interface UseAiChatOptions {
  open?: boolean
}

interface UseAiChatReturn {
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  displayMessages: ChatMessage[]
  hasMessages: boolean
  images: ImageItem[]
  hasImages: boolean
  isUploadingImages: boolean
  handleImageSelect: (files: FileList | null) => void
  removeImage: (index: number) => void
  clearImages: () => void
  completion: string | undefined
  isLoading: boolean
  model: string
  setModel: (value: string) => void
  provider: AIProvider
  setProvider: (value: AIProvider) => void
  stop: () => void
  handleSend: () => void
  handleClear: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

/** 单张图片：本地预览 + 上传后的 URL */
interface ImageItem {
  id: string
  preview: string
  url?: string
  uploading?: boolean
}

const MAX_IMAGE_COUNT = 5

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { open } = options

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [completion, setCompletion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState<string>(() => {
    // 从 localStorage 读取，默认使用 qwen2.5:0.5b
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ollama_model')
      return saved || 'qwen2.5:0.5b'
    }
    return 'qwen2.5:0.5b'
  })

  // AI 提供商状态
  const [provider, setProvider] = useState<AIProvider>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_provider')
      if (saved === 'github' || saved === 'minimax' || saved === 'ollama' || saved === 'zhipuai') {
        return saved
      }
    }
    return 'ollama'
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<ImageItem[]>([])

  // 过滤掉 system 消息用于显示
  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0
  const hasImages = images.length > 0
  const isUploadingImages = images.some(item => item.uploading)

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, completion, isLoading])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  const revokePreview = useCallback((preview: string) => {
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
  }, [])

  const clearImages = useCallback(() => {
    setImages(prev => {
      prev.forEach(item => revokePreview(item.preview))
      return []
    })
  }, [revokePreview])

  // 关闭弹窗时清理附件，避免旧图片残留与 blob 泄漏
  useEffect(() => {
    if (!open) {
      clearImages()
    }
  }, [open, clearImages])

  // 卸载时释放所有 blob URL
  useEffect(() => {
    return () => {
      imagesRef.current.forEach(item => revokePreview(item.preview))
    }
  }, [revokePreview])

  // 上传单张图片到后端（又拍云）
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

  // 处理图片选择：先本地预览，再异步上传
  const handleImageSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      const remainingSlots = Math.max(0, MAX_IMAGE_COUNT - images.length)

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
            revokePreview(preview)
            toast.error(err instanceof Error ? err.message : '图片上传失败')
            setImages(prev => prev.filter(item => item.id !== id))
          })
      })
    },
    [images.length, uploadImageToServer, revokePreview]
  )

  const removeImage = useCallback(
    (index: number) => {
      setImages(prev => {
        const item = prev[index]
        if (item) {
          revokePreview(item.preview)
        }
        return prev.filter((_, i) => i !== index)
      })
    },
    [revokePreview]
  )

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
    clearImages()
  }, [stop, clearImages])

  // 发送消息
  const handleSend = useCallback(async () => {
    if (isLoading) return

    const imageUrls = images.map(item => item.url).filter((url): url is string => !!url)
    const hasReadyImages = imageUrls.length > 0

    if (!prompt.trim() && !hasReadyImages) return
    if (isUploadingImages) {
      toast.warning('图片上传中，请稍候')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim() || '请描述这张图片',
      images: imageUrls.map(url => ({ url })),
    }

    // 添加用户消息到历史
    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setPrompt('')
    clearImages()
    setIsLoading(true)
    setCompletion('')

    // 创建 abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 准备消息列表（确保有 system 消息）
      const chatMessages: ChatMessage[] = newMessages.some(m => m.role === 'system')
        ? newMessages
        : [
            {
              role: 'system',
              content: AI_SYSTEM_PROMPT,
            },
            ...newMessages,
          ]

      const requestMessages = chatMessages.map(({ role, content }) => ({ role, content }))

      // 调用 API
      const requestProvider = hasReadyImages ? 'zhipuai' : provider
      const requestModel = hasReadyImages && provider !== 'zhipuai' ? undefined : model

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useChat: true,
          messages: requestMessages,
          model: requestModel,
          provider: requestProvider,
          images: imageUrls,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
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
              const metadata = JSON.parse(line.slice(2))
              // 流完成，将 accumulatedContent 添加到消息中
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

      // 处理剩余缓冲区
      if (buffer.trim()) {
        if (buffer.startsWith('0:')) {
          try {
            const content = JSON.parse(buffer.slice(2))
            accumulatedContent += content
            setCompletion(accumulatedContent)
          } catch (e) {
            console.warn('Failed to parse remaining buffer:', buffer)
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
        // 用户主动停止，不显示错误
        return
      }

      console.error('AI chat error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message.includes('fetch')
            ? 'AI服务暂时不可用，请检查网络连接或配置'
            : error.message
          : 'AI服务发生未知错误'

      // 添加错误消息
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
  }, [prompt, messages, images, isUploadingImages, isLoading, model, provider, clearImages])

  // 当 model 改变时保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ollama_model', model)
    }
  }, [model])

  // 当 provider 改变时保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_provider', provider)
    }
  }, [provider])

  // 当切换到智谱AI时，自动设置默认模型
  useEffect(() => {
    if (provider === 'zhipuai') {
      const savedModel = localStorage.getItem('zhipuai_model')
      if (savedModel) {
        setModel(savedModel)
      } else {
        setModel('glm-4.7')
        localStorage.setItem('zhipuai_model', 'glm-4.7')
      }
    }
  }, [provider])

  // 当 model 改变时，如果是智谱AI，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && provider === 'zhipuai') {
      localStorage.setItem('zhipuai_model', model)
    }
  }, [model, provider])

  return {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    images,
    hasImages,
    isUploadingImages,
    handleImageSelect,
    removeImage,
    clearImages,
    completion: completion || undefined,
    isLoading,
    model,
    setModel,
    provider,
    setProvider,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  }
}

// 默认导出作为备用
export default useAiChat
