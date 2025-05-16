"use client"

import React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SpeedDial() {
  const router = useRouter()

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
        onClick={() => router.push("/thing/add")}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  )
}

export default function ThingSpeedDial() {
  return <SpeedDial />
} 