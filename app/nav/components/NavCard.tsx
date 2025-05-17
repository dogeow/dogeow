"use client"

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { NavItem } from '@/app/nav/types';
import { useNavStore } from '@/app/nav/stores/navStore';
import { useRouter } from 'next/navigation';
import { ExternalLink, MoreVertical, Pencil, Trash } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavCardProps {
  item: NavItem;
}

export function NavCard({ item }: NavCardProps) {
  const router = useRouter();
  const { recordClick, deleteItem } = useNavStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 记录点击
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      visitSite();
    }
  };
  
  // 访问网站
  const visitSite = async () => {
    try {
      await recordClick(item.id);
      
      // 在新窗口打开链接
      if (item.is_new_window) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.url;
      }
    } catch (error) {
      console.error('访问失败:', error);
    }
  };
  
  // 编辑导航项
  const handleEdit = () => {
    router.push(`/nav/edit/${item.id}`);
  };
  
  // 删除导航项
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteItem(item.id);
      toast.success('导航项删除成功');
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow py-1">
        <CardContent className="p-3 relative flex">
          <div className="mr-3 flex-shrink-0">
            {item.icon ? (
              <div className="h-10 w-10 flex items-center justify-center">
                <img src={item.icon} alt={`${item.name} 图标`} className="max-h-full max-w-full" />
              </div>
            ) : (
              <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-grow min-w-0">
            <a 
              href={item.url} 
              target={item.is_new_window ? "_blank" : "_self"} 
              rel="noopener noreferrer"
              onClick={handleClick}
              className="block"
            >
              <h3 className="font-medium text-base truncate">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
              )}
            </a>
          </div>
          
          <div className="ml-auto flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">更多选项</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>编辑</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setConfirmOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>删除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除"{item.name}"吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground"
            >
              {loading ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 