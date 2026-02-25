'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, Bot, MoreVertical, Edit, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Word } from '../types'
import { useWordStore } from '../stores/wordStore'
import { markWord, markWordAsSimple } from '../hooks/useWord'
import { WordAIDialog } from './WordAIDialog'
import { EditWordDialog } from './EditWordDialog'
import { toast } from 'sonner'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface WordCardProps {
  word: Word
  onNext: () => void
}

export function WordCard({ word, onNext }: WordCardProps) {
  const { showTranslation, toggleTranslation, updateDailyProgress, learningStatus } = useWordStore()
  const [isMarking, setIsMarking] = useState(false)
  const [isMarkingSimple, setIsMarkingSimple] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { speak, speakWord, cancel, voicesLoaded } = useSpeechSynthesis()

  // 自动发音
  useEffect(() => {
    if (!voicesLoaded) return

    const timer = setTimeout(() => {
      speakWord(word.content)
    }, 200)

    return () => {
      clearTimeout(timer)
      cancel()
    }
  }, [word.content, voicesLoaded, speakWord, cancel])

  const handlePronounce = () => {
    speakWord(word.content)
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
        <CardContent className="relative p-6">
          {/* 卡片右上角：更多按钮+菜单（仅展示释义时显示） */}
          {showTranslation && (
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="更多操作">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkSimpleAndNext} disabled={isMarkingSimple}>
                    <CheckCircle className="text-muted-foreground mr-2 h-4 w-4" />
                    简单词
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="text-muted-foreground mr-2 h-4 w-4" />
                    编辑单词
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
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
                {word.explanation ? (
                  <div className="text-base whitespace-pre-line">
                    {word.explanation.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无中文释义</p>
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

              {/* 确认按钮 - 记住了 / AI / 还是不会 */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => handleMarkAndNext(true)}
                  disabled={isMarking}
                  className="max-w-[120px] flex-1"
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
                  <Bot className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleMarkAndNext(false)}
                  disabled={isMarking}
                  variant="outline"
                  className="max-w-[120px] flex-1"
                >
                  还是不会
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <WordAIDialog word={word} open={showAIDialog} onOpenChange={setShowAIDialog} />
      {/* 编辑单词Dialog（复用组件，后续实现） */}
      <EditWordDialog word={word} open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  )
}
