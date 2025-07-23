'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function NoteSpeedDial() {
  const router = useRouter()

  return (
    <div className="fixed right-6 bottom-24 z-50">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-[#78B15E] text-white shadow-lg hover:bg-[#6CA052]"
        onClick={() => router.push('/note/new')}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
