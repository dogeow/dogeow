'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import CreateTagDialog from '@/app/thing/components/CreateTagDialog'

export default function TagSpeedDial() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleTagCreated = () => {
    mutate('/things/tags')
  }

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

      <CreateTagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTagCreated={handleTagCreated}
      />
    </>
  )
}
