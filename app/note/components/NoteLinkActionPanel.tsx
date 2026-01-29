'use client'

import { useState, useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteLink } from '@/lib/api/wiki'
import type { LinkData, ThemeColors, NodeData } from '../types/graph'

interface NoteLinkActionPanelProps {
  activeLink: LinkData | null
  nodes: NodeData[]
  themeColors: ThemeColors
  isAdmin: boolean
  onLinkDeleted: () => void
  onClose: () => void
}

export default function NoteLinkActionPanel({
  activeLink,
  nodes,
  themeColors,
  isAdmin,
  onLinkDeleted,
  onClose,
}: NoteLinkActionPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false)
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

  // 获取源节点和目标节点信息
  const getSourceNode = () => {
    if (!activeLink) return null
    const sourceId =
      typeof activeLink.source === 'object' ? activeLink.source.id : activeLink.source
    return nodes.find(n => String(n.id) === String(sourceId))
  }

  const getTargetNode = () => {
    if (!activeLink) return null
    const targetId =
      typeof activeLink.target === 'object' ? activeLink.target.id : activeLink.target
    return nodes.find(n => String(n.id) === String(targetId))
  }

  const sourceNode = getSourceNode()
  const targetNode = getTargetNode()

  // 删除链接
  const handleDeleteLink = async () => {
    if (!activeLink || !activeLink.id) return

    if (
      !confirm(
        `确定要删除链接"${sourceNode?.title || '未知'} → ${targetNode?.title || '未知'}"吗？`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteLink(activeLink.id)
      toast.success('链接已删除')
      onLinkDeleted()
      onClose()
    } catch (error) {
      console.error('删除链接失败:', error)
      toast.error('删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeLink || !sourceNode || !targetNode) return null

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
        touchAction: 'none',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* 链接信息显示 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1" style={{ color: themeColors.foreground }}>
          <div className="font-medium">
            {sourceNode.title} → {targetNode.title}
          </div>
          {activeLink.type && (
            <div className="text-muted-foreground mt-1 text-sm">类型: {activeLink.type}</div>
          )}
        </div>
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
      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <Button
            onClick={handleDeleteLink}
            disabled={isDeleting}
            size={isMobile ? 'sm' : 'default'}
            variant="destructive"
            style={{
              flex: isMobile ? '1 1 calc(50% - 4px)' : 'none',
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? '删除中...' : '取消关联'}
          </Button>
        )}
      </div>
    </div>
  )
}
