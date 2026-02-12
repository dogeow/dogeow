'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { WordDataEditor } from '../components/WordDataEditor'
import { searchWord, createWord } from '../hooks/useWord'
import { Word } from '../types'
import { Search, ArrowLeft, Loader2, BookOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SearchWordPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    found: boolean
    word?: Word
    keyword?: string
  } | null>(null)

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入要搜索的单词')
      return
    }

    setIsSearching(true)
    try {
      const result = await searchWord(keyword.trim())
      setSearchResult(result)

      if (result.found) {
        toast.success('找到单词！')
      } else {
        toast.info('未找到该单词，可以使用 AI 生成')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      toast.error('搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCreateWord = async (data: {
    phonetic_us: string
    explanation: string
    example_sentences: Array<{ en: string; zh: string }>
  }) => {
    if (!searchResult?.keyword) return

    try {
      const result = await createWord({
        content: searchResult.keyword,
        ...data,
      })

      toast.success('单词已添加到数据库')

      // 显示创建成功的单词
      setSearchResult({
        found: true,
        word: result.word,
      })
    } catch (error) {
      console.error('创建单词失败:', error)
      throw error
    }
  }

  return (
    <PageContainer maxWidth="2xl">
      {/* 标题栏 */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/word')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">搜索单词</h1>
      </div>

      {/* 搜索框 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入要搜索的单词..."
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  搜索
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {searchResult && (
        <>
          {searchResult.found && searchResult.word ? (
            // 找到单词 - 显示单词详情
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="mb-2 text-3xl font-bold">{searchResult.word.content}</h2>
                    {searchResult.word.phonetic_us && (
                      <p className="text-muted-foreground mb-4">
                        /{searchResult.word.phonetic_us}/
                      </p>
                    )}

                    {/* 教育级别标签 */}
                    {searchResult.word.education_levels &&
                      searchResult.word.education_levels.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {searchResult.word.education_levels.map(level => (
                            <span
                              key={level.id}
                              className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                            >
                              {level.name}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* 释义 */}
                    {searchResult.word.explanation && (
                      <div className="bg-muted/50 mb-4 rounded-lg p-4">
                        <h3 className="mb-2 text-sm font-semibold">释义</h3>
                        <div className="whitespace-pre-line">
                          {searchResult.word.explanation.split('\n').map((line, idx) => (
                            <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 例句 */}
                    {searchResult.word.example_sentences &&
                      searchResult.word.example_sentences.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold">例句</h3>
                          {searchResult.word.example_sentences.map((example, index) => (
                            <div key={index} className="bg-muted/30 rounded-lg p-3 text-sm">
                              <p className="mb-1">{example.en}</p>
                              <p className="text-muted-foreground text-xs">{example.zh}</p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-center gap-3 border-t pt-4">
                  <Button onClick={() => setSearchResult(null)} variant="outline">
                    继续搜索
                  </Button>
                  <Link href="/word">
                    <Button variant="outline">返回首页</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            // 未找到单词 - 显示创建表单
            <div className="space-y-4">
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <CardContent className="flex items-start gap-3 p-4">
                  <Plus className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      未找到单词 &quot;{searchResult.keyword}&quot;
                    </p>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      你可以使用 AI 生成单词数据并添加到数据库
                    </p>
                  </div>
                </CardContent>
              </Card>

              <WordDataEditor
                wordContent={searchResult.keyword || ''}
                onSave={handleCreateWord}
                saveButtonText="创建并保存"
              />

              <div className="flex justify-center">
                <Button onClick={() => setSearchResult(null)} variant="outline">
                  取消
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 空状态提示 */}
      {!searchResult && (
        <Card>
          <CardContent className="space-y-4 p-12 text-center">
            <BookOpen className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">搜索单词</h2>
              <p className="text-muted-foreground text-sm">
                输入单词进行搜索，如果单词不存在可以用 AI 生成并添加
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
