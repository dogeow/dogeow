'use client'

import React, { useState, useEffect } from 'react'
import { Item } from '@/app/thing/types'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Link2Icon,
  PackageIcon,
  RepeatIcon,
  BoxesIcon,
  FolderTreeIcon,
  FileIcon,
  Trash2Icon,
  PlusIcon,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { ItemRelationSelector } from './ItemRelationSelector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ItemRelation extends Item {
  pivot?: {
    relation_type: string
    description: string | null
  }
}

interface ItemRelationsDisplayProps {
  itemId: number
  canEdit?: boolean
}

const RELATION_TYPE_CONFIG = {
  related: { icon: Link2Icon, label: '相关物品', color: 'bg-blue-500' },
  accessory: { icon: PackageIcon, label: '配件', color: 'bg-green-500' },
  replacement: { icon: RepeatIcon, label: '替换品', color: 'bg-yellow-500' },
  bundle: { icon: BoxesIcon, label: '套装', color: 'bg-purple-500' },
  parent: { icon: FolderTreeIcon, label: '父物品', color: 'bg-orange-500' },
  child: { icon: FileIcon, label: '子物品', color: 'bg-pink-500' },
}

export function ItemRelationsDisplay({ itemId, canEdit = false }: ItemRelationsDisplayProps) {
  const [relatedItems, setRelatedItems] = useState<ItemRelation[]>([])
  const [relatingItems, setRelatingItems] = useState<ItemRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ItemRelation | null>(null)

  // 加载关联数据
  const loadRelations = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiRequest<{
        related_items: ItemRelation[]
        relating_items: ItemRelation[]
      }>(`/things/items/${itemId}/relations`)

      setRelatedItems(response.related_items || [])
      setRelatingItems(response.relating_items || [])
    } catch (error) {
      console.error('加载关联失败:', error)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    loadRelations()
  }, [loadRelations])

  // 删除关联
  const handleDeleteRelation = async (relatedItemId: number) => {
    setDeletingId(relatedItemId)
    try {
      await apiRequest(`/things/items/${itemId}/relations/${relatedItemId}`, 'DELETE')
      await loadRelations()
    } catch (error) {
      console.error('删除关联失败:', error)
      alert('删除关联失败，请重试')
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setItemToDelete(null)
    }
  }

  // 确认删除
  const confirmDelete = (item: ItemRelation) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  // 渲染关联物品卡片
  const renderRelationCard = (item: ItemRelation, isOutgoing: boolean) => {
    const relationType = item.pivot?.relation_type || 'related'
    const config = RELATION_TYPE_CONFIG[relationType as keyof typeof RELATION_TYPE_CONFIG]
    const Icon = config?.icon || Link2Icon

    return (
      <Card key={item.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 图片 */}
            {item.thumbnail_url ? (
              <Image
                src={item.thumbnail_url}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-lg text-sm">
                无图
              </div>
            )}

            {/* 内容 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-muted-foreground text-sm">{item.category?.name || '未分类'}</p>
                </div>

                {/* 关联类型标签 */}
                <Badge className={`${config?.color} text-white`}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config?.label}
                </Badge>
              </div>

              {/* 描述 */}
              {item.pivot?.description && (
                <p className="text-muted-foreground text-sm">{item.pivot.description}</p>
              )}

              {/* 操作按钮 */}
              {canEdit && isOutgoing && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2Icon className="mr-1 h-3 w-3" />
                        删除关联
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  const hasRelations = relatedItems.length > 0 || relatingItems.length > 0

  return (
    <div className="space-y-4">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">关联物品</h3>
        {canEdit && (
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            添加关联
          </Button>
        )}
      </div>

      {!hasRelations ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Link2Icon className="text-muted-foreground mx-auto h-12 w-12" />
          <p className="text-muted-foreground mt-2 text-sm">暂无关联物品</p>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              添加第一个关联
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* 此物品关联的其他物品 */}
          {relatedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">关联到的物品</h4>
              <div className="space-y-2">
                {relatedItems.map(item => renderRelationCard(item, true))}
              </div>
            </div>
          )}

          {/* 分隔线 */}
          {relatedItems.length > 0 && relatingItems.length > 0 && <Separator />}

          {/* 其他物品关联到此物品 */}
          {relatingItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                被关联的物品（其他物品指向此物品）
              </h4>
              <div className="space-y-2">
                {relatingItems.map(item => renderRelationCard(item, false))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 添加关联对话框 */}
      <ItemRelationSelector
        currentItemId={itemId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onRelationAdded={loadRelations}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除关联</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除与&ldquo;{itemToDelete?.name}&rdquo;的关联吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDeleteRelation(itemToDelete.id)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
