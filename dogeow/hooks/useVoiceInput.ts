'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// 浏览器语音识别 API 类型（非标准，仅部分浏览器支持）
interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
}
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; length: number; 0: { transcript: string }; [i: number]: { transcript: string } }>
}
interface SpeechRecognitionErrorEvent {
  error: string
}

// 检查浏览器是否支持语音识别
const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  const w = window as SpeechRecognitionWindow
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

// 获取 SpeechRecognition 构造函数
const getSpeechRecognition = (): (new () => SpeechRecognitionInstance) | null => {
  if (typeof window === 'undefined') return null
  const w = window as SpeechRecognitionWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseVoiceInputOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  language?: string // 默认为浏览器语言
  continuous?: boolean // 是否持续监听
  interimResults?: boolean // 是否返回临时结果
}

export interface UseVoiceInputReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    onTranscript,
    onError,
    language = 'zh-CN',
    continuous = false,
    interimResults = true,
  } = options

  const [isSupported] = useState(isSpeechRecognitionSupported())
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')

  // 初始化语音识别
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = 1

    // 识别结果处理
    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptText = result[0].transcript

        if (result.isFinal) {
          final += transcriptText
          finalTranscriptRef.current += transcriptText
        } else {
          interim += transcriptText
        }
      }

      if (interim) {
        setInterimTranscript(interim)
        onTranscript?.(interim, false)
      }

      if (final) {
        setTranscript(finalTranscriptRef.current)
        setInterimTranscript('')
        onTranscript?.(finalTranscriptRef.current, true)
      }
    }

    // 错误处理
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = '语音识别错误'

      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试'
          break
        case 'audio-capture':
          errorMessage = '无法访问麦克风'
          break
        case 'not-allowed':
          errorMessage = '麦克风访问被拒绝'
          break
        case 'network':
          errorMessage = '网络错误，请检查连接'
          break
        case 'aborted':
          errorMessage = '语音识别已中止'
          break
        default:
          errorMessage = `语音识别错误: ${event.error}`
      }

      setError(errorMessage)
      onError?.(errorMessage)
      setIsListening(false)
      toast.error(errorMessage)
    }

    // 识别开始
    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    // 识别结束
    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [isSupported, language, continuous, interimResults, onTranscript, onError])

  // 开始监听
  const startListening = useCallback(() => {
    if (!isSupported) {
      const message = '您的浏览器不支持语音识别功能'
      toast.error(message)
      setError(message)
      return
    }

    if (!recognitionRef.current) {
      const message = '语音识别未初始化'
      toast.error(message)
      setError(message)
      return
    }

    try {
      finalTranscriptRef.current = transcript
      setInterimTranscript('')
      recognitionRef.current.start()
      toast.success('开始语音识别...')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'InvalidStateError') {
        // 已经在运行中
        console.warn('语音识别已在运行')
      } else {
        const message = '启动语音识别失败'
        setError(message)
        toast.error(message)
      }
    }
  }, [isSupported, transcript])

  // 停止监听
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        toast.success('语音识别已停止')
      } catch (err) {
        console.error('停止语音识别失败:', err)
      }
    }
  }, [])

  // 重置转录文本
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
