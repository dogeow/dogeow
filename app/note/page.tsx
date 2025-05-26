"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Calendar, 
  MoreVertical,
  Filter
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { 
  Card, 
  CardContent, 
  CardHeader
} from '@/components/ui/card'

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  created_at: string
  updated_at: string
  is_draft: boolean
}

// 背景色数组
const backgroundColors = [
  'bg-blue-50 dark:bg-blue-950/30', 
  'bg-indigo-50 dark:bg-indigo-950/30', 
  'bg-purple-50 dark:bg-purple-950/30', 
  'bg-pink-50 dark:bg-pink-950/30', 
  'bg-red-50 dark:bg-red-950/30', 
  'bg-orange-50 dark:bg-orange-950/30', 
  'bg-yellow-50 dark:bg-yellow-950/30', 
  'bg-green-50 dark:bg-green-950/30', 
  'bg-teal-50 dark:bg-teal-950/30', 
  'bg-cyan-50 dark:bg-cyan-950/30'
];

export default function NotePage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 获取笔记列表
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await apiRequest<Note[]>('/notes')
        setNotes(data)
      } catch {
        console.error('获取笔记列表失败:', error)
        toast.error('无法加载笔记列表')
      } finally {
        setLoading(false)
      }
    }
    
    fetchNotes()
  }, [])

  // 删除笔记
  const deleteNote = async (id: number) => {
    if (!confirm('确定要删除这个笔记吗？此操作无法撤销。')) {
      return
    }
    
    try {
      await apiRequest(`/notes/${id}`, 'DELETE')
      setNotes(notes.filter(note => note.id !== id))
      toast.success('笔记已删除')
    } catch {
      console.error('删除笔记失败:', error)
      toast.error('删除笔记失败')
    }
  }

  // 筛选和排序笔记
  const filteredAndSortedNotes = notes
    .filter(note => {
      const searchLower = searchTerm.toLowerCase();
      return note.title.toLowerCase().includes(searchLower) ||
        (note.content_markdown && note.content_markdown.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else {
        const valueA = new Date(a[sortBy]).getTime();
        const valueB = new Date(b[sortBy]).getTime();
        return sortOrder === 'asc'
          ? valueA - valueB
          : valueB - valueA
      }
    });

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch {
      return dateString
    }
  }

  // 获取Markdown摘要
  const getMarkdownPreview = (markdown: string, maxLength = 150) => {
    if (!markdown) return '';
    const plainText = markdown.replace(/[#*`>-]/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  // 根据笔记ID生成一致的背景色
  const getNoteBackground = (noteId: number) => {
    // 使用ID作为索引，确保同一笔记总是获得相同的背景色
    const index = noteId % backgroundColors.length;
    return backgroundColors[index];
  }

  return (
    <div className="container py-4">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">笔记列表</h1>
        <Button onClick={() => router.push('/note/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新建笔记
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索笔记..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              排序
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('updated_at')}>
              最近更新 {sortBy === 'updated_at' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('created_at')}>
              创建时间 {sortBy === 'created_at' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('title')}>
              标题 {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              切换顺序 ({sortOrder === 'desc' ? '降序' : '升序'})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border p-0 dark:border-slate-700">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 mx-4 mt-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 mx-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1 mx-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mx-4 mb-4"></div>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedNotes.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? '没有找到匹配的笔记' : '还没有创建任何笔记'}
          </p>
          {!searchTerm && (
            <Button onClick={() => router.push('/note/new')}>
              <Plus className="mr-2 h-4 w-4" />
              创建第一个笔记
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedNotes.map(note => (
             <Link key={note.id} href={`/note/${note.id}`} passHref legacyBehavior>
              <Card 
                key={note.id} 
                className={`${getNoteBackground(note.id)} hover:shadow-md transition-all duration-200 border-transparent hover:border-primary dark:text-slate-200`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Link 
                      href={`/note/edit/${note.id}`}
                      className="font-medium text-lg hover:underline"
                    >
                      {note.title || '(无标题)'}
                      {note.is_draft && (
                        <span className="ml-2 text-xs text-muted-foreground">(草稿)</span>
                      )}
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/note/edit/${note.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteNote(note.id)}>
                          <Trash className="mr-2 h-4 w-4" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="text-sm text-muted-foreground dark:text-slate-400 mt-1 flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      更新于 {formatDate(note.updated_at)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="py-2">
                  <div className="text-sm text-muted-foreground dark:text-slate-300 prose prose-sm max-w-none line-clamp-2">
                    {note.content_markdown ? (
                      <div className="line-clamp-2">
                        <ReactMarkdown>
                          {getMarkdownPreview(note.content_markdown)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="italic">(无内容)</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}