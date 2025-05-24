"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import MarkdownEditor from '@/components/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Edit, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'

interface NoteEditorProps {
  noteId?: number
  title?: string
  content?: string
  isEditing?: boolean
  initialMarkdown?: string
}

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
}

interface UploadResult {
  url: string
  path: string
}

// 工具函数：判断字符串是否为合法的 Slate JSON
function isValidSlateJson(str: string) {
  try {
    const val = JSON.parse(str)
    return Array.isArray(val) && val.every(item => item.type && item.children)
  } catch {
    return false
  }
}

export default function NoteEditor({ 
  noteId, 
  title = '', 
  content = '', 
  isEditing = false,
  initialMarkdown = ''
}: NoteEditorProps) {
  const router = useRouter()
  const [noteTitle, setNoteTitle] = useState(title)
  const [isSaving, setIsSaving] = useState(false)
  const [markdownPreview, setMarkdownPreview] = useState(initialMarkdown)

  const safeContent = isValidSlateJson(content)
    ? content
    : '[{"type":"paragraph","children":[{"text":""}]}]'

  // 保存笔记内容
  const handleSave = async (content: string) => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      setIsSaving(true)
      
      const data = {
        title: noteTitle,
        content
      }

      let result;
      
      if (isEditing && noteId) {
        // 更新笔记
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
        // 更新预览
        if (result.content_markdown) {
          setMarkdownPreview(result.content_markdown)
        }
      } else {
        // 创建新笔记
        result = await apiRequest<Note>('/notes', 'POST', data)
        if (result.content_markdown) {
          setMarkdownPreview(result.content_markdown)
        }
      }
      
      toast.success(isEditing ? '笔记已更新' : '笔记已创建')
      
      // 如果是新笔记，跳转到编辑页面
      if (!isEditing && result.id) {
        router.push(`/note/edit/${result.id}`)
        router.refresh()
      }
      
      return Promise.resolve()
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
      return Promise.reject(error)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const result = await apiRequest<UploadResult>('/upload/image', 'POST', formData, { 
        handleError: false
      })
      
      return result
    } catch (error) {
      console.error('图片上传错误:', error)
      toast.error('图片上传失败')
      throw error
    }
  }

  // 编辑器内容改变时更新预览
  const handleEditorChange = (content: string) => {
    // 这里会从保存后的响应中获取markdown预览
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/note')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">创建新笔记</h1>
      </div>
      <div className="mb-4">
        <Input
          id="title"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          className="mt-1"
          placeholder="请输入笔记标题"
        />
      </div>
      <MarkdownEditor
        initialContent={safeContent}
        onSave={handleSave}
        onImageUpload={handleImageUpload}
        minHeight="400px"
      />
    </div>
  )
} 