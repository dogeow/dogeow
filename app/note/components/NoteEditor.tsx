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
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/note')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        
        <div className="mb-4">
          <Label htmlFor="title" className="text-base font-medium">
            笔记标题
          </Label>
          <Input
            id="title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="mt-1"
            placeholder="请输入笔记标题"
          />
        </div>
      </div>
      
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            预览
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-0">
          <MarkdownEditor
            initialContent={content}
            onSave={handleSave}
            onImageUpload={handleImageUpload}
            minHeight="400px"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-md p-4 min-h-[400px] prose max-w-none dark:prose-invert">
            {isEditing && noteId ? (
              markdownPreview ? (
                <ReactMarkdown>
                  {markdownPreview}
                </ReactMarkdown>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>保存内容后可查看预览</p>
                </div>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>保存内容后可查看预览</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 