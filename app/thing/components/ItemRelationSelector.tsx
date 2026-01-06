'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Item } from '@/app/thing/types'
import { apiRequest } from '@/lib/api'
import { Search, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface ItemRelationSelectorProps {
  currentItemId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onRelationAdded: () => void
}

const RELATION_TYPES = [
  { value: 'related', label: '相关物品', description: '相关联的物品' },
  { value: 'accessory', label: '配件', description: '此物品的配件' },
  { value: 'replacement', label: '替换品', description: '可替换的物品' },
  { value: 'bundle', label: '套装', description: '套装中的其他物品' },
  { value: 'parent', label: '父物品', description: '包含此物品的物品' },
  { value: 'child', label: '子物品', description: '此物品包含的子物品' },
]

export function ItemRelationSelector({
  currentItemId,
  open,
  onOpenChange,
  onRelationAdded,
}: ItemRelationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [relationType, setRelationType] = useState<string>('related')
  const [description, setDescription] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 搜索物品
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await apiRequest<{
        results: Item[]
      }>(`/things/search?q=${encodeURIComponent(searchQuery)}`)

      // 过滤掉当前物品
      const filtered = response.results.filter(item => item.id !== currentItemId)
      setSearchResults(filtered)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // 选择物品
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
  }

  // 添加关联
  const handleAddRelation = async () => {
    if (!selectedItem) return

    setIsSaving(true)
    try {
      await apiRequest(`/things/items/${currentItemId}/relations`, 'POST', {
        related_item_id: selectedItem.id,
        relation_type: relationType,
        description: description.trim() || null,
      })

      // 重置表单
      setSearchQuery('')
      setSearchResults([])
      setSelectedItem(null)
      setRelationType('related')
      setDescription('')

      // 通知父组件
      onRelationAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('添加关联失败:', error)
      alert('添加关联失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 搜索时支持回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加物品关联</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 搜索物品 */}
          <div className="space-y-2">
            <Label>搜索物品</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入物品名称进行搜索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>搜索结果</Label>
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-2">
                {searchResults.map(item => (
                  <div
                    key={item.id}
                    className={`hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors ${
                      selectedItem?.id === item.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => handleSelectItem(item)}
                  >
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded text-xs">
                        无图
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {item.category?.name || '未分类'}
                      </div>
                    </div>
                    {selectedItem?.id === item.id && <Badge variant="default">已选择</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 选中的物品 */}
          {selectedItem && (
            <>
              {/* 关联类型 */}
              <div className="space-y-2">
                <Label>关联类型</Label>
                <Select value={relationType} onValueChange={setRelationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-muted-foreground text-xs">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 关联描述 */}
              <div className="space-y-2">
                <Label>关联描述（可选）</Label>
                <Textarea
                  placeholder="描述这两个物品之间的关联..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleAddRelation} disabled={!selectedItem || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '添加关联'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
