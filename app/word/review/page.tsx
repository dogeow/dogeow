'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WordCard } from '../components/WordCard'
import { useReviewWords, useWordSettings, checkIn } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { CheckCircle2, BookX, ArrowLeft, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout'

export default function ReviewPage() {
  const router = useRouter()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: words, isLoading: wordsLoading, error, mutate } = useReviewWords()
  const {
    currentWords,
    setCurrentWords,
    currentIndex,
    nextWord,
    learningStatus,
    setLearningStatus,
    dailyProgress,
    startStudy,
    reset,
  } = useWordStore()
  const [isCompleting, setIsCompleting] = useState(false)

  const isLoading = settingsLoading || wordsLoading
  const hasSelectedBook = !!settings?.current_book_id

  useEffect(() => {
    if (!words) return

    // 处理 API 返回的数据格式
    const wordsArray = Array.isArray(words) ? words : (words as any)?.data || []

    if (wordsArray.length > 0) {
      setCurrentWords(wordsArray)
      setLearningStatus('reviewing')
      startStudy()
    }
  }, [words, setCurrentWords, setLearningStatus, startStudy])

  const handleNext = () => {
    if (currentIndex < currentWords.length - 1) {
      nextWord()
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await checkIn()
      setLearningStatus('completed')
      toast.success('复习完成！已打卡')
    } catch (error) {
      toast.error('打卡失败')
      console.error('打卡失败:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleContinue = () => {
    reset()
    mutate()
  }

  // 加载中
  if (isLoading) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  // 错误处理
  if (error) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">
              加载失败: {error instanceof Error ? error.message : '未知错误'}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => mutate()} variant="outline">
                重试
              </Button>
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 未选择单词书
  if (!hasSelectedBook) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <BookX className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">请先选择单词书</h2>
              <p className="text-muted-foreground text-sm">
                在设置中选择要学习的单词书后才能开始复习
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/word/settings">
                <Button>去设置</Button>
              </Link>
              <Link href="/word">
                <Button variant="outline">返回首页</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 复习完成
  if (learningStatus === 'completed') {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">复习完成！</h2>
              <p className="text-muted-foreground text-sm">
                今天复习了 {dailyProgress.reviewed} 个单词
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={handleContinue}>继续一组</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 处理 API 返回的数据格式
  const wordsArray = Array.isArray(words) ? words : (words as any)?.data || []

  // 今天没有需要复习的单词
  if (wordsArray.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">今天没有需要复习的单词</h2>
              <p className="text-muted-foreground text-sm">
                先去学习新单词吧，学过的单词会在适当的时间提醒你复习
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/word/learn">
                <Button>去学习</Button>
              </Link>
              <Link href="/word">
                <Button variant="outline">返回首页</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 正在初始化
  if (currentWords.length === 0) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  const currentWord = currentWords[currentIndex]

  return (
    <PageContainer maxWidth="2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/word">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-muted-foreground text-sm">
          {currentIndex + 1} / {currentWords.length}
        </p>
        <div className="w-9" />
      </div>
      {currentWord && <WordCard word={currentWord} onNext={handleNext} />}
    </PageContainer>
  )
}
