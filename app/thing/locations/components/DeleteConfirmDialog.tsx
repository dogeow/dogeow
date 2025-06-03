"use client"

import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { LocationType } from '../hooks/useLocationManagement'
import { getLocationTypeText } from '../constants'

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
  const getItemName = () => {
    if (!itemToDelete) return ''
    const typeText = getLocationTypeText(itemToDelete.type)
    return `${typeText} ${itemToDelete.id}`
  }

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={getItemName()}
    />
  )
} 