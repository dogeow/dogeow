import React, { memo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EyeOff } from 'lucide-react'

interface FloatingReferenceProps {
  imageUrl: string
  onClose: () => void
}

export const FloatingReference = memo<FloatingReferenceProps>(({ imageUrl, onClose }) => {
  const [magnifierVisible, setMagnifierVisible] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })

  const handleMagnifierStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setMagnifierPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    setMagnifierVisible(true)
  }

  const handleMagnifierMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!magnifierVisible) return
    e.preventDefault()

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setMagnifierPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  const handleMagnifierEnd = () => {
    setMagnifierVisible(false)
  }

  return (
    <div className="fixed top-4 right-4 z-50 lg:absolute lg:top-0 lg:right-0 lg:z-10">
      <Card className="border-primary/20 border-2 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">原图参考</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-5 w-5 p-0 hover:bg-gray-100"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
        <div className="relative h-32 w-32 overflow-hidden rounded border border-gray-200">
          <div
            className="relative h-full w-full cursor-crosshair"
            onMouseDown={handleMagnifierStart}
            onMouseMove={handleMagnifierMove}
            onMouseUp={handleMagnifierEnd}
            onMouseLeave={handleMagnifierEnd}
            onTouchStart={handleMagnifierStart}
            onTouchMove={handleMagnifierMove}
            onTouchEnd={handleMagnifierEnd}
          >
            <Image src={imageUrl} alt="浮动原图参考" fill className="object-cover" sizes="128px" />

            {/* 放大镜 */}
            {magnifierVisible && (
              <div
                className="pointer-events-none absolute z-50"
                style={{
                  left: `${magnifierPosition.x}%`,
                  top: `${magnifierPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: '500%',
                      backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  {/* 十字准线 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-0.5 w-full bg-red-500 opacity-50"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-0.5 bg-red-500 opacity-50"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
})

FloatingReference.displayName = 'FloatingReference'
