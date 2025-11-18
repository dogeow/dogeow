'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, X, Plus } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createLink, type WikiNode } from '@/lib/api/wiki'

interface LinkCreatorProps {
  nodes: WikiNode[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  sourceNodeId?: number
}

export default function LinkCreator({
  nodes,
  open,
  onOpenChange,
  onSuccess,
  sourceNodeId,
}: LinkCreatorProps) {
  const [sourceId, setSourceId] = useState<number | ''>(sourceNodeId || '')
  const [targetId, setTargetId] = useState<number | ''>('')
  const [type, setType] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (open) {
      setSourceId(sourceNodeId || '')
      setTargetId('')
      setType('')
    }
  }, [open, sourceNodeId])

  const handleCreate = async () => {
    if (!sourceId || !targetId) {
      toast.error('请选择源节点和目标节点')
      return
    }

    if (sourceId === targetId) {
      toast.error('源节点和目标节点不能相同')
      return
    }

    try {
      setIsCreating(true)
      await createLink({
        source_id: Number(sourceId),
        target_id: Number(targetId),
        type: type.trim() || undefined,
      })
      toast.success('链接已创建')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('创建链接错误:', error)
      toast.error('创建失败')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <Dialog.Title className="text-lg font-semibold">创建链接</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 p-4">
            {/* 源节点选择 */}
            <div>
              <label className="mb-2 block text-sm font-medium">源节点 *</label>
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-md border p-2"
                disabled={!!sourceNodeId}
              >
                <option value="">请选择源节点</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 目标节点选择 */}
            <div>
              <label className="mb-2 block text-sm font-medium">目标节点 *</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-md border p-2"
              >
                <option value="">请选择目标节点</option>
                {nodes
                  .filter(node => node.id !== sourceId)
                  .map(node => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* 链接类型 */}
            <div>
              <label className="mb-2 block text-sm font-medium">链接类型（可选）</label>
              <input
                type="text"
                value={type}
                onChange={e => setType(e.target.value)}
                placeholder="例如：相关、依赖、包含"
                className="w-full rounded-md border p-2"
              />
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2 border-t p-4">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={isCreating}>
                取消
              </Button>
            </Dialog.Close>
            <Button onClick={handleCreate} disabled={isCreating || !sourceId || !targetId}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  创建链接
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
