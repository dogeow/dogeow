import { useCallback, useEffect, useState } from 'react'

interface SpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

const DEFAULT_VOICES = [
  'Samantha',
  'Alex',
  'Daniel',
  'Karen',
  'Google US English',
  'Google UK English',
  'Microsoft Zira',
  'Microsoft David',
]

/**
 * 语音合成 hook
 * 提供英语单词发音功能
 */
export function useSpeechSynthesis() {
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // 加载语音列表
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const loadVoices = () => {
      const loadedVoices = speechSynthesis.getVoices()
      setVoices(loadedVoices)
      if (loadedVoices.length > 0) {
        setVoicesLoaded(true)
      }
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      speechSynthesis.onvoiceschanged = null
    }
  }, [])

  /**
   * 停止当前语音
   */
  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
  }, [])

  /**
   * 朗读文本
   */
  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

      try {
        cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = options.lang ?? 'en-US'
        utterance.rate = options.rate ?? 0.85
        utterance.pitch = options.pitch ?? 1
        utterance.volume = options.volume ?? 1

        // 优先选择高质量的英语声音
        let selectedVoice = voices.find(v => DEFAULT_VOICES.some(name => v.name.includes(name)))

        // 退而求其次，找任何英语声音
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en'))
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('发音失败:', error)
      }
    },
    [voices, cancel]
  )

  /**
   * 朗读英语单词（快捷方法）
   */
  const speakWord = useCallback((word: string) => speak(word), [speak])

  return {
    speak,
    speakWord,
    cancel,
    voicesLoaded,
    voices,
  }
}
