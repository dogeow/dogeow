"use client"

import React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SpeedDialProps {
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  className?: string
}

export function SpeedDial({ 
  href = "/thing/add", 
  onClick,
  icon = <Plus className="h-5 w-5" />,
  className = "h-12 w-12 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
}: SpeedDialProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <Button
        size="icon"
        className={className}
        onClick={handleClick}
      >
        {icon}
      </Button>
    </div>
  )
}

export default function ThingSpeedDial() {
  return <SpeedDial />
} 