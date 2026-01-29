'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Edit2, Link as LinkIcon, X, Check, FileText, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateNode } from '@/lib/api/wiki'
import type { NodeData, ThemeColors } from '../types/graph'

interface NoteNodeActionPanelProps {
  activeNode: NodeData | null
  themeColors: ThemeColors
  isAdmin: boolean
  onCreateChildNode: () => void
  onCreateLink: () => void
  onViewArticle?: () => void
  onEditNode?: () => void
  onDeleteNode?: () => void
  onNodeUpdated: () => void
  onClose: () => void
}

export default function NoteNodeActionPanel({
  activeNode,
  themeColors,
  isAdmin,
  onCreateChildNode,
  onCreateLink,
  onViewArticle,
  onEditNode,
  onDeleteNode,
  onNodeUpdated,
  onClose,
}: NoteNodeActionPanelProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 初始化编辑名称
  useEffect(() => {
    if (activeNode) {
      setEditingName(activeNode.title)
      setIsEditingName(false)
    }
  }, [activeNode])

  // 聚焦输入框
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  // 开始编辑名称
  const handleStartEditName = useCallback(() => {
    if (!activeNode || !isAdmin) return
    setEditingName(activeNode.title)
    setIsEditingName(true)
  }, [activeNode, isAdmin])

  // 取消编辑名称
  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false)
    setEditingName(activeNode?.title || '')
  }, [activeNode])

  // 保存名称
  const handleSaveName = useCallback(async () => {
    if (!activeNode || !isAdmin || !editingName.trim()) {
      handleCancelEditName()
      return
    }

    if (editingName.trim() === activeNode.title) {
      setIsEditingName(false)
      return
    }

    try {
      setIsSaving(true)
      await updateNode(Number(activeNode.id), {
        title: editingName.trim(),
      })
      toast.success('节点名称已更新')
      setIsEditingName(false)
      onNodeUpdated()
    } catch (error) {
      console.error('更新节点名称失败:', error)
      toast.error('更新失败')
      handleCancelEditName()
    } finally {
      setIsSaving(false)
    }
  }, [activeNode, editingName, isAdmin, onNodeUpdated, handleCancelEditName])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveName()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancelEditName()
      }
    },
    [handleSaveName, handleCancelEditName]
  )

  if (!activeNode) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? 16 : 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: 12,
        padding: isMobile ? 12 : 16,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: isMobile ? 'calc(100% - 32px)' : 'auto',
        maxWidth: isMobile ? 'calc(100% - 32px)' : 600,
        touchAction: 'none', // 防止触摸滚动
      }}
      onClick={e => e.stopPropagation()} // 防止点击事件冒泡
    >
      {/* 节点名称显示/编辑 */}
      <div className="mb-3 flex items-center gap-2">
        {isEditingName ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="flex-1"
              style={{
                background: themeColors.background,
                color: themeColors.foreground,
                borderColor: themeColors.border,
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveName}
              disabled={isSaving || !editingName.trim()}
              style={{
                padding: '4px 8px',
                minWidth: 'auto',
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEditName}
              disabled={isSaving}
              style={{
                padding: '4px 8px',
                minWidth: 'auto',
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex-1 cursor-pointer truncate font-medium"
            style={{ color: themeColors.foreground }}
            title={isAdmin ? '点击编辑名称' : activeNode.title}
            onClick={isAdmin ? handleStartEditName : undefined}
          >
            {activeNode.title}
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          style={{
            padding: '4px 8px',
            minWidth: 'auto',
          }}
          title="关闭"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {activeNode.slug && onViewArticle && (
          <Button
            onClick={onViewArticle}
            size="sm"
            variant="outline"
            title="查看文章"
            style={{
              borderColor: themeColors.border,
              padding: '4px 8px',
              minWidth: 'auto',
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {isAdmin && onEditNode && (
          <Button
            onClick={onEditNode}
            size="sm"
            variant="outline"
            title="编辑节点"
            style={{
              borderColor: themeColors.border,
              padding: '4px 8px',
              minWidth: 'auto',
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={onCreateChildNode}
            size="sm"
            title="创建子节点"
            style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '4px 8px',
              minWidth: 'auto',
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={onCreateLink}
            size="sm"
            variant="outline"
            title="链接节点"
            style={{
              borderColor: themeColors.border,
              padding: '4px 8px',
              minWidth: 'auto',
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        )}
        {isAdmin && onDeleteNode && (
          <Button
            onClick={onDeleteNode}
            size="sm"
            variant="outline"
            title="删除节点"
            style={{
              borderColor: themeColors.border,
              padding: '4px 8px',
              minWidth: 'auto',
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
