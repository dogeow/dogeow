'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, Sparkles, Zap } from 'lucide-react'
import { Word } from '../types'
import { useWordStore } from '../stores/wordStore'
import { markWord, markWordAsSimple } from '../hooks/useWord'
import { WordAIDialog } from './WordAIDialog'
import { toast } from 'sonner'

interface WordCardProps {
  word: Word
  onNext: () => void
}

export function WordCard({ word, onNext }: WordCardProps) {
  const { showTranslation, toggleTranslation, updateDailyProgress, learningStatus } = useWordStore()
  const [isMarking, setIsMarking] = useState(false)
  const [isMarkingSimple, setIsMarkingSimple] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)

  // 发音函数
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      utterance.pitch = 1
      utterance.volume = 1

      // 获取语音列表
      const voices = speechSynthesis.getVoices()

      // 优先选择高质量的英语声音
      const preferredVoices = [
        'Samantha',
        'Alex',
        'Daniel',
        'Karen', // macOS
        'Google US English',
        'Google UK English',
        'Microsoft Zira',
        'Microsoft David',
      ]

      let selectedVoice = null
      for (const name of preferredVoices) {
        selectedVoice = voices.find(v => v.name.includes(name))
        if (selectedVoice) break
      }

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
  }, [])

  // 加载语音列表
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        setVoicesLoaded(true)
      }
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // 自动发音
  useEffect(() => {
    if (!voicesLoaded) return

    const timer = setTimeout(() => {
      speak(word.content)
    }, 200)

    return () => {
      clearTimeout(timer)
      speechSynthesis.cancel()
    }
  }, [word.content, voicesLoaded, speak])

  const handlePronounce = () => {
    speak(word.content)
  }

  const handleMarkAndNext = async (remembered: boolean) => {
    setIsMarking(true)
    try {
      await markWord(word.id, remembered)

      // 更新进度
      if (learningStatus === 'learning') {
        updateDailyProgress('learned')
      } else if (learningStatus === 'reviewing') {
        updateDailyProgress('reviewed')
      }

      // 进入下一个单词
      setTimeout(onNext, 150)
    } catch (error) {
      console.error('标记单词失败:', error)
    } finally {
      setIsMarking(false)
    }
  }

  const handleShowTranslation = () => {
    toggleTranslation()
  }

  const handleMarkSimpleAndNext = async () => {
    setIsMarkingSimple(true)
    try {
      await markWordAsSimple(word.id)
      toast.success('已设为简单词，后续不再背诵')
      updateDailyProgress('learned')
      onNext()
    } catch (error) {
      console.error('设为简单词失败:', error)
      toast.error('操作失败')
    } finally {
      setIsMarkingSimple(false)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          {/* 单词和音标 */}
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-3xl font-bold">{word.content}</h2>
            <div className="text-muted-foreground flex items-center justify-center gap-3 text-sm">
              {word.phonetic_us && <span>/{word.phonetic_us}/</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePronounce}
                className="h-8 w-8 p-0"
                aria-label="发音"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
            {/* 教育级别标签 */}
            {word.education_levels && word.education_levels.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {word.education_levels.map(level => (
                  <span
                    key={level.id}
                    className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {level.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 选择记得/不记得 */}
          {!showTranslation ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">你记得这个单词吗？</p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={handleShowTranslation}
                  disabled={isMarking}
                  className="max-w-[120px] flex-1"
                >
                  记得
                </Button>
                <Button
                  onClick={handleShowTranslation}
                  variant="outline"
                  className="max-w-[120px] flex-1"
                >
                  不记得
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 释义 */}
              <div className="bg-muted/50 rounded-lg p-4">
                {word.explanation?.zh ? (
                  <div className="text-base whitespace-pre-line">
                    {word.explanation.zh.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无中文释义</p>
                )}
                {word.explanation?.en && (
                  <p className="text-muted-foreground mt-1 text-sm">{word.explanation.en}</p>
                )}
              </div>

              {/* 例句 */}
              {word.example_sentences && word.example_sentences.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-muted-foreground text-sm font-medium">例句</h4>
                  {word.example_sentences.slice(0, 2).map((example, index) => (
                    <div key={index} className="bg-muted/30 rounded p-3 text-sm">
                      <p className="mb-1">{example.en}</p>
                      <p className="text-muted-foreground text-xs">{example.zh}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 确认按钮 - 记住了 / AI / 还是不会 / 简单词 */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  onClick={() => handleMarkAndNext(true)}
                  disabled={isMarking}
                  className="max-w-[100px] flex-1"
                >
                  记住了
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIDialog(true)}
                  className="h-9 w-9 shrink-0"
                  aria-label="AI 学习"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleMarkAndNext(false)}
                  disabled={isMarking}
                  variant="outline"
                  className="max-w-[100px] flex-1"
                >
                  还是不会
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSimpleAndNext}
                  disabled={isMarkingSimple}
                  className="shrink-0 gap-1"
                  title="设为简单词，不再背诵和复习"
                >
                  <Zap className="h-3.5 w-3.5" />
                  简单词
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <WordAIDialog word={word} open={showAIDialog} onOpenChange={setShowAIDialog} />
    </>
  )
}
