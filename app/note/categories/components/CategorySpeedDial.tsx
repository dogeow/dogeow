'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddCategoryDialog from './AddCategoryDialog'

interface CategorySpeedDialProps {
  onCategoryAdded: () => void
}

export default function CategorySpeedDial({ onCategoryAdded }: CategorySpeedDialProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className="fixed right-6 bottom-24 z-50">
        <Button
          size="icon"
          className="bg-primary hover:bg-primary/90 h-14 w-14 rounded-full text-white shadow-lg"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCategoryAdded={onCategoryAdded}
      />
    </>
  )
}
