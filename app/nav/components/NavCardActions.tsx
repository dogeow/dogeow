'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NavItem } from '@/types'
import useNavStore from '../store/useNavStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pencil, Trash } from 'lucide-react'
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog'
import { toast } from 'react-hot-toast'

interface NavCardActionsProps {
  item: NavItem
  // Assuming deleteItem from useNavStore returns a Promise and takes an id
  deleteItem: (id: number) => Promise<void> 
}

export default function NavCardActions({ item, deleteItem }: NavCardActionsProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    router.push(`/nav/edit/${item.id}`)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteItem(item.id)
      toast.success('导航项删除成功')
      setConfirmOpen(false)
    } catch (error) {
      toast.error('删除失败，请稍后再试')
      console.error('Failed to delete nav item:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmOpen(true)} className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={loading}
        itemName={item.name}
        itemType="导航项"
      />
    </>
  )
}
