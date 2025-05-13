"use client"

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
import { LocationType } from '../hooks/useLocationManagement'

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToDelete: {id: number, type: LocationType} | null;
  onConfirm: () => Promise<boolean | undefined>;
}

export default function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  itemToDelete, 
  onConfirm 
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            {itemToDelete?.type === 'area' && '删除区域将同时删除其下所有房间和位置。'}
            {itemToDelete?.type === 'room' && '删除房间将同时删除其下所有位置。'}
            此操作无法撤销，且可能影响已存储的物品。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 