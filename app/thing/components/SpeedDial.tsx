"use client"

import React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SpeedDial() {
  const router = useRouter()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
        onClick={() => router.push("/thing/add")}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

export default function ThingSpeedDial() {
  return <SpeedDial />
} 