'use client'

import { useState, useEffect } from 'react'
import { SettingsForm } from '../components/SettingsForm'
import { useBooks, useWordSettings, updateWordSettings } from '../hooks/useWord'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'

const STORAGE_KEY_BOOKS_EXPANDED = 'word_books_expanded'

export default function SettingsPage() {
  const { data: books, isLoading: booksLoading } = useBooks()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const [selectingBookId, setSelectingBookId] = useState<number | null>(null)
  const currentBookId = settings?.current_book_id

  const [booksExpanded, setBooksExpanded] = useState(true)

  useEffect(() => {
    // 读取单词书列表折叠状态
    const booksExpandedStored =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_BOOKS_EXPANDED) : null
    setBooksExpanded(booksExpandedStored !== 'false')
  }, [])

  const handleToggleBooksExpanded = () => {
    const newValue = !booksExpanded
    setBooksExpanded(newValue)
    localStorage.setItem(STORAGE_KEY_BOOKS_EXPANDED, String(newValue))
  }

  const handleSelectBook = async (bookId: number) => {
    setSelectingBookId(bookId)
    try {
      await updateWordSettings({ current_book_id: bookId })
      toast.success('单词书选择成功')
      mutate('/word/settings')
      mutate('/word/stats')
    } catch (error) {
      toast.error('选择单词书失败')
      console.error('选择单词书失败:', error)
    } finally {
      setSelectingBookId(null)
    }
  }

  const isLoading = booksLoading || settingsLoading

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <Link href="/word">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      {/* 单词书列表（可折叠） */}
      <Card>
        <button
          type="button"
          onClick={handleToggleBooksExpanded}
          className="hover:bg-accent/50 flex w-full items-center justify-between rounded-t-lg px-6 py-4 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${booksExpanded ? 'rotate-0' : '-rotate-90'}`}
            />
            <span className="font-semibold">单词书</span>
          </div>
          {settings?.current_book && (
            <span className="text-muted-foreground text-sm">
              当前：{settings.current_book.name}
            </span>
          )}
        </button>
        {booksExpanded && (
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner className="h-5 w-5" />
              </div>
            ) : books && books.length > 0 ? (
              books.map(book => {
                const isSelected = currentBookId === book.id
                const isSelecting = selectingBookId === book.id
                return (
                  <div
                    key={book.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => !isSelected && handleSelectBook(book.id)}
                      disabled={isSelecting}
                    >
                      {isSelecting && <LoadingSpinner className="h-4 w-4 shrink-0" />}
                      <span className={`truncate font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {book.name}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-sm">
                        （{book.total_words} 词）
                      </span>
                    </button>
                    <Link href={`/word/books/${book.id}`} className="shrink-0">
                      <Button variant="outline" size="sm">
                        查看
                      </Button>
                    </Link>
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground py-2 text-sm">
                暂无单词书，请先运行 db:seed 导入数据
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* 学习设置 */}
      <SettingsForm />
    </div>
  )
}
