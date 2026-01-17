'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save, Loader2, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createNode, updateNode, createLink, getArticle, type WikiNode } from '@/lib/api/wiki'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

interface NodeEditorProps {
  node?: WikiNode | null
  templateNode?: WikiNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function NoteNodeEditor({
  node,
  templateNode,
  open,
  onOpenChange,
  onSuccess,
}: NodeEditorProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [summary, setSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const resetEditorStorage = useCallback(() => {
    window.localStorage.removeItem('novel-content')
    window.localStorage.removeItem('html-content')
    window.localStorage.removeItem('markdown')
  }, [])

  const hydrateEditorStorage = useCallback(
    async (slug?: string) => {
      if (!slug) {
        resetEditorStorage()
        return
      }
      try {
        const article = await getArticle(slug)
        if (article.content) {
          try {
            const parsedContent = JSON.parse(article.content)
            window.localStorage.setItem('novel-content', JSON.stringify(parsedContent))
          } catch {
            const defaultContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: article.content || '',
                    },
                  ],
                },
              ],
            }
            window.localStorage.setItem('novel-content', JSON.stringify(defaultContent))
          }
        } else {
          window.localStorage.removeItem('novel-content')
        }

        if (article.content_markdown) {
          window.localStorage.setItem('markdown', article.content_markdown)
        } else {
          window.localStorage.removeItem('markdown')
        }
      } catch (error) {
        console.error('加载节点内容失败:', error)
      }
    },
    [resetEditorStorage]
  )

  // 初始化编辑器内容
  useEffect(() => {
    if (!open) return

    let cancelled = false
    const init = async () => {
      setIsLoaded(false)

      if (node) {
        setTitle(node.title || '')
        setTags(node.tags || [])
        setSummary(node.summary || '')
        await hydrateEditorStorage(node.slug)
      } else if (templateNode) {
        setTitle(templateNode.title ? `${templateNode.title} - 新节点` : '')
        setTags(templateNode.tags || [])
        setSummary(templateNode.summary || '')
        await hydrateEditorStorage(templateNode.slug)
      } else {
        setTitle('')
        setTags([])
        setSummary('')
        resetEditorStorage()
      }

      if (!cancelled) {
        setIsLoaded(true)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [open, node, templateNode, hydrateEditorStorage, resetEditorStorage])

  // 获取当前编辑器内容
  const getCurrentContent = () => {
    const content = window.localStorage.getItem('novel-content')
    const markdown = window.localStorage.getItem('markdown')
    return {
      content:
        content ||
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
      markdown: markdown || '',
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 保存节点
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入节点标题')
      return
    }

    const { content, markdown } = getCurrentContent()

    try {
      setIsSaving(true)

      const data = {
        title: title.trim(),
        tags: tags,
        summary: summary.trim() || undefined,
        content,
        content_markdown: markdown,
      }

      if (node) {
        // 更新节点
        await updateNode(node.id, data)
        toast.success('节点已更新')
      } else {
        // 创建节点
        const response = await createNode(data)
        const newNodeId = response?.node?.id

        if (newNodeId && templateNode?.id) {
          try {
            await createLink({
              source_id: templateNode.id,
              target_id: newNodeId,
            })
            toast.success('节点已创建并自动连接')
          } catch (linkError) {
            console.error('创建节点链接失败:', linkError)
            toast.warning('节点已创建，但未能自动连线，请手动补充链接')
          }
        } else {
          toast.success('节点已创建')
        }
      }

      // 清除本地存储
      if (!node) {
        window.localStorage.removeItem('novel-content')
        window.localStorage.removeItem('html-content')
        window.localStorage.removeItem('markdown')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('保存节点错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, tags, summary, node, templateNode, onSuccess, onOpenChange])

  // 添加快捷键支持
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, title, isSaving, handleSave])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="border-border bg-background text-foreground fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border shadow-lg">
          <div className="border-border flex items-center justify-between border-b p-4">
            <Dialog.Title className="text-lg font-semibold">
              {node ? '编辑节点' : '新建节点'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="hover:bg-muted rounded p-1">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* 标题输入框 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">标题 *</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="请输入节点标题"
                className="bg-background text-foreground placeholder:text-muted-foreground w-full"
              />
            </div>

            {/* 标签输入 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">标签</label>
              <div className="mb-2 flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="输入标签后按回车"
                  className="bg-background text-foreground placeholder:text-muted-foreground flex-1"
                />
                <Button onClick={handleAddTag} variant="outline">
                  添加
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-2 py-1 text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 摘要输入 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">摘要</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="请输入节点摘要"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground min-h-[80px] w-full resize-y rounded-md border p-2"
              />
            </div>

            {/* 编辑器 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">内容</label>
              {isLoaded && <TailwindAdvancedEditor />}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="border-border flex justify-end gap-2 border-t p-4">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={isSaving}>
                取消
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
