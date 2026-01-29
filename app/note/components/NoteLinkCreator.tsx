'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, X, Plus, MousePointerClick } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createLink, type WikiNode } from '@/lib/api/wiki'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'

interface LinkCreatorProps {
  nodes: WikiNode[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  sourceNodeId?: number
  onSelectTargetFromGraph?: (callback: (nodeId: number) => void) => void
  onCancelSelectFromGraph?: () => void
}

export interface NoteLinkCreatorRef {
  selectTargetNode: (nodeId: number) => void
}

const NoteLinkCreator = forwardRef<NoteLinkCreatorRef, LinkCreatorProps>(
  (
    {
      nodes,
      open,
      onOpenChange,
      onSuccess,
      sourceNodeId,
      onSelectTargetFromGraph,
      onCancelSelectFromGraph,
    },
    ref
  ) => {
    const [sourceId, setSourceId] = useState<number | ''>(sourceNodeId || '')
    const [targetId, setTargetId] = useState<number | ''>('')
    const [type, setType] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isSelectingFromGraph, setIsSelectingFromGraph] = useState(false)

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      selectTargetNode: (nodeId: number) => {
        if (nodeId !== sourceId) {
          setTargetId(nodeId)
          setIsSelectingFromGraph(false)
          toast.success('已选择目标节点')
        } else {
          toast.error('目标节点不能与源节点相同')
        }
      },
    }))

    useEffect(() => {
      if (open) {
        setSourceId(sourceNodeId || '')
        // 对话框打开时，清除选择状态（因为已经完成选择或取消）
        setIsSelectingFromGraph(false)
        // 如果目标节点未选择，重置类型
        if (!targetId) {
          setType('')
        }
      }
    }, [open, sourceNodeId, targetId])

    // 单独处理对话框关闭时的重置逻辑
    useEffect(() => {
      if (!open && !isSelectingFromGraph) {
        // 正常关闭（不是从图谱选择模式），重置目标节点和类型
        setTargetId('')
        setType('')
      }
    }, [open, isSelectingFromGraph])

    const handleStartSelectFromGraph = () => {
      setIsSelectingFromGraph(true)
      toast.info('请在图谱中点击要链接的节点')

      // 先关闭对话框，让用户可以看到并点击图谱中的节点
      onOpenChange(false)

      // 通知父组件可以开始从图谱选择
      if (onSelectTargetFromGraph) {
        onSelectTargetFromGraph((nodeId: number) => {
          if (nodeId !== sourceId) {
            setTargetId(nodeId)
            setIsSelectingFromGraph(false)
            toast.success('已选择目标节点')
            // 重新打开对话框
            onOpenChange(true)
          } else {
            toast.error('目标节点不能与源节点相同')
            setIsSelectingFromGraph(false)
            // 重新打开对话框
            onOpenChange(true)
          }
        })
      }
    }

    // 当对话框关闭时，只有在不是从图谱选择模式时才清除选择状态
    useEffect(() => {
      if (!open && !isSelectingFromGraph) {
        // 正常关闭，取消从图谱选择模式
        if (onCancelSelectFromGraph) {
          onCancelSelectFromGraph()
        }
      }
    }, [open, isSelectingFromGraph, onCancelSelectFromGraph])

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

    // 准备 Combobox 选项
    const sourceOptions: ComboboxOption[] = nodes.map(node => ({
      value: String(node.id),
      label: node.title,
    }))

    const targetOptions: ComboboxOption[] = nodes
      .filter(node => node.id !== sourceId)
      .map(node => ({
        value: String(node.id),
        label: node.title,
      }))

    const selectedSourceOption = sourceOptions.find(opt => opt.value === String(sourceId))

    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="border-border bg-background text-foreground fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg">
            <div className="border-border flex items-center justify-between border-b p-4">
              <Dialog.Title className="text-lg font-semibold">创建链接</Dialog.Title>
              <Dialog.Close asChild>
                <button className="hover:bg-muted rounded p-1">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 p-4">
              {/* 源节点选择 */}
              <div>
                <label className="mb-2 block text-sm font-medium">源节点 *</label>
                {sourceNodeId ? (
                  <div className="border-border bg-muted text-muted-foreground flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
                    {selectedSourceOption?.label || '已选择源节点'}
                  </div>
                ) : (
                  <Combobox
                    options={sourceOptions}
                    value={sourceId ? String(sourceId) : ''}
                    onChange={value => setSourceId(value ? Number(value) : '')}
                    placeholder="请选择源节点"
                    searchText="搜索源节点..."
                    emptyText="没有找到节点"
                  />
                )}
              </div>

              {/* 目标节点选择 */}
              <div>
                <label className="mb-2 block text-sm font-medium">目标节点 *</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Combobox
                      options={targetOptions}
                      value={targetId ? String(targetId) : ''}
                      onChange={value => {
                        setTargetId(value ? Number(value) : '')
                        setIsSelectingFromGraph(false)
                        // 取消从图谱选择模式
                        if (onCancelSelectFromGraph) {
                          onCancelSelectFromGraph()
                        }
                      }}
                      placeholder="请选择目标节点"
                      searchText="搜索目标节点..."
                      emptyText="没有找到节点"
                    />
                  </div>
                  <Button
                    type="button"
                    variant={isSelectingFromGraph ? 'default' : 'outline'}
                    onClick={handleStartSelectFromGraph}
                    className="shrink-0"
                    title="从图谱中选择节点"
                  >
                    <MousePointerClick className="h-4 w-4" />
                  </Button>
                </div>
                {isSelectingFromGraph && (
                  <p className="text-muted-foreground mt-1 text-xs">请在图谱中点击要链接的节点</p>
                )}
              </div>

              {/* 链接类型 */}
              <div>
                <label className="mb-2 block text-sm font-medium">链接类型（可选）</label>
                <input
                  type="text"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  placeholder="例如：相关、依赖、包含"
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border p-2"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="border-border flex justify-end gap-2 border-t p-4">
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
)

NoteLinkCreator.displayName = 'NoteLinkCreator'

export default NoteLinkCreator
