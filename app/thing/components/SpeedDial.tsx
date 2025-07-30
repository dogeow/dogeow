'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SpeedDialProps {
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  className?: string
}

export function SpeedDial({
  href = '/thing/add',
  onClick,
  icon = <Plus className="h-6 w-6" />,
  className = 'h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white',
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
    <div className="fixed right-6 bottom-24 z-50">
      <Button size="icon" className={className} onClick={handleClick}>
        {icon}
      </Button>
    </div>
  )
}

export default function ThingSpeedDial() {
  return <SpeedDial />
}
