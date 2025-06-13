"use client"

import React, { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import AddTagDialog from "./AddTagDialog"

export default function TagSpeedDial() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      <AddTagDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </>
  )
} 