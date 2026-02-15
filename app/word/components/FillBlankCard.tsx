'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Volume2 } from 'lucide-react'
import { Word } from '../types'
import { toast } from 'sonner'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface FillBlankCardProps {
  word: Word
  onNext: (correct: boolean) => void
}

export function FillBlankCard({ word, onNext }: FillBlankCardProps) {
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const { speakWord } = useSpeechSynthesis()

  // 随机选择一个例句
  const [selectedExample] = useState(() => {
    if (word.example_sentences && word.example_sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * word.example_sentences.length)
      return word.example_sentences[randomIndex]
    }
    return null
  })

  // 将例句中的单词替换为下划线
  const maskedSentence = selectedExample
    ? selectedExample.en.replace(
        new RegExp(`\\b${word.content}\\b`, 'gi'),
        '_'.repeat(word.content.length)
      )
    : ''

  // 状态在 word 切换时通过父组件 key={word.id} 重置

  const handleSubmit = () => {
    if (!userInput.trim()) {
      toast.error('请输入答案')
      return
    }

    const correct = userInput.trim().toLowerCase() === word.content.toLowerCase()
    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      toast.success('正确！')
    } else {
      toast.error('不正确，再试试')
    }
  }

  const handleNext = () => {
    onNext(isCorrect)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!showResult) {
        handleSubmit()
      } else {
        handleNext()
      }
    }
  }

  if (!selectedExample) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">该单词没有例句</p>
          <Button onClick={() => onNext(false)} className="mt-4">
            下一个
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        {/* 提示信息 */}
        <div className="text-center">
          <h3 className="text-muted-foreground mb-2 text-sm">根据例句填写单词</h3>
          {word.phonetic_us && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <span>/{word.phonetic_us}/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakWord(word.content)}
                className="h-6 w-6 p-0"
                aria-label="发音"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* 例句（挖空） */}
        <div className="bg-muted/50 space-y-3 rounded-lg p-4">
          <p className="text-base leading-relaxed">{maskedSentence}</p>
          <p className="text-muted-foreground text-sm">{selectedExample.zh}</p>
        </div>

        {/* 输入框 */}
        <div className="space-y-3">
          <Input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入单词"
            disabled={showResult}
            className="text-center text-lg"
            autoFocus
          />

          {/* 结果显示 */}
          {showResult && (
            <div
              className={`flex items-center justify-center gap-2 rounded-lg p-3 ${
                isCorrect
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">正确！</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">答案是：{word.content}</span>
                </>
              )}
            </div>
          )}

          {/* 完整释义（仅错误时显示） */}
          {showResult && !isCorrect && word.explanation && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground mb-1 text-xs font-medium">中文释义</p>
              <div className="whitespace-pre-line">
                {word.explanation.split('\n').map((line, idx) => (
                  <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-3 pt-2">
          {!showResult ? (
            <Button onClick={handleSubmit} className="min-w-[120px]">
              提交答案
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-[120px]">
              下一个
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
