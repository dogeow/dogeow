'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddTagDialog from './AddTagDialog'

export default function TagSpeedDial() {
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

      <AddTagDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
