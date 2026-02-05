'use client'

import { useBooks } from '../hooks/useWord'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { updateWordSettings } from '../hooks/useWord'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function BooksPage() {
  const router = useRouter()
  const { data: books, isLoading } = useBooks()

  const handleSelectBook = async (bookId: number) => {
    try {
      await updateWordSettings({ current_book_id: bookId })
      toast.success('单词书选择成功')
      router.push('/word')
    } catch (error) {
      toast.error('选择单词书失败')
      console.error('选择单词书失败:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">选择单词书</h1>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <Card key={book.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>{book.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{book.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    共 {book.total_words} 个单词
                  </span>
                  <Button onClick={() => handleSelectBook(book.id)}>选择</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">暂无单词书，请先运行 Seeder 导入单词数据</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
