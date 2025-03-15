"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import Image from "next/image"

interface ItemCardProps {
  item: any
  viewMode: 'grid' | 'list'
  onEdit: () => void
  onView: () => void
}

export default function ItemCard({ item, viewMode, onEdit, onView }: ItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('删除失败')
      }
      
      toast.success("物品已成功删除")
      
      // 刷新物品列表
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setDeleteDialogOpen(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'expired':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }
  
  const formatDate = (date: string) => {
    if (!date) return '无'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  if (viewMode === 'grid') {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-square bg-muted">
          {item.primary_image ? (
            <Image
              src={`http://127.0.0.1:8000/storage/${item.primary_image.path}`}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              无图片
            </div>
          )}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  查看
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex justify-between items-center">
              <Badge variant={item.is_public ? "default" : "outline"} className="bg-background/80 backdrop-blur-sm">
                {item.is_public ? '公开' : '私有'}
              </Badge>
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
            </div>
          </div>
        </div>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-2 flex-grow">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">数量</p>
              <p className="font-medium">{item.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">价格</p>
              <p className="font-medium">{item.purchase_price ? `¥${item.purchase_price}` : '无'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">购买日期</p>
              <p className="font-medium truncate">{formatDate(item.purchase_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">过期日期</p>
              <p className="font-medium truncate">{formatDate(item.expiry_date)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
          {item.spot?.name ? (
            <p className="text-xs text-muted-foreground truncate w-full">
              <span className="inline-block mr-1">📍</span>
              {item.spot.room?.area?.name ? `${item.spot.room.area.name} > ` : ''}
              {item.spot.room?.name ? `${item.spot.room.name} > ` : ''}
              {item.spot.name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">未指定位置</p>
          )}
        </CardFooter>
      </Card>
    )
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex p-4">
        <div className="relative w-24 h-24 bg-muted rounded-md mr-4 flex-shrink-0">
          {item.primary_image ? (
            <Image
              src={`http://127.0.0.1:8000/storage/${item.primary_image.path}`}
              alt={item.name}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              无图片
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <Badge variant={item.is_public ? "default" : "outline"} className="bg-background/80 backdrop-blur-sm text-xs">
              {item.is_public ? '公开' : '私有'}
            </Badge>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm mt-2">
            <div>
              <p className="text-xs text-muted-foreground">数量</p>
              <p className="font-medium">{item.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">价格</p>
              <p className="font-medium">{item.purchase_price ? `¥${item.purchase_price}` : '无'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">购买日期</p>
              <p className="font-medium truncate">{formatDate(item.purchase_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">过期日期</p>
              <p className="font-medium truncate">{formatDate(item.expiry_date)}</p>
            </div>
          </div>
          <div className="mt-2">
            {item.spot?.name ? (
              <p className="text-xs text-muted-foreground truncate">
                <span className="inline-block mr-1">📍</span>
                {item.spot.room?.area?.name ? `${item.spot.room.area.name} > ` : ''}
                {item.spot.room?.name ? `${item.spot.room.name} > ` : ''}
                {item.spot.name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">未指定位置</p>
            )}
          </div>
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除 "{item.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 