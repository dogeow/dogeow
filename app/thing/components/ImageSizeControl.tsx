'use client'

import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import {
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  GripIcon,
  RectangleHorizontalIcon,
} from 'lucide-react'
import { ensureEven } from '@/lib/helpers/mathUtils'

interface ImageSizeControlProps {
  initialSize: number
  maxSize: number
  onSizeChange: (newSize: number) => void
}

type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PRESET_COLUMNS: Record<SizePreset, number> = {
  xs: 6,
  sm: 4,
  md: 3,
  lg: 2,
  xl: 1,
}

export function ImageSizeControl({ initialSize, maxSize, onSizeChange }: ImageSizeControlProps) {
  const [imageSize, setImageSize] = useState(initialSize)
  const [currentSizePreset, setCurrentSizePreset] = useState<SizePreset>('md')
  const containerRef = useRef<HTMLDivElement>(null)

  const getCalculatedSize = useCallback(
    (preset: SizePreset, containerWidth: number): number => {
      const columns = SIZE_PRESET_COLUMNS[preset]
      const gap = 8
      const newSize = ensureEven((containerWidth - (columns - 1) * gap) / columns)
      const finalSize = Math.max(60, Math.min(newSize, maxSize))
      return finalSize
    },
    [maxSize]
  )

  useEffect(() => {
    const newSize = getCalculatedSize('md', containerRef.current!.offsetWidth)
    setImageSize(newSize)
    onSizeChange(newSize)
  }, [getCalculatedSize, onSizeChange])

  useEffect(() => {
    const handleResize = () => {
      const newSize = getCalculatedSize(currentSizePreset, containerRef.current!.offsetWidth)
      setImageSize(newSize)
      onSizeChange(newSize)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentSizePreset, getCalculatedSize, onSizeChange])

  const handlePresetClick = (preset: SizePreset) => {
    const newSize = getCalculatedSize(preset, containerRef.current!.offsetWidth)
    setImageSize(newSize)
    onSizeChange(newSize)
    setCurrentSizePreset(preset)
  }

  const sizePresets = [
    { id: 'xs', label: 'XS', icon: <GripIcon className="h-4 w-4" /> },
    { id: 'sm', label: 'S', icon: <Columns4Icon className="h-4 w-4" /> },
    { id: 'md', label: 'M', icon: <Columns3Icon className="h-4 w-4" /> },
    { id: 'lg', label: 'L', icon: <Columns2Icon className="h-4 w-4" /> },
    { id: 'xl', label: 'XL', icon: <RectangleHorizontalIcon className="h-4 w-4" /> },
  ] as const satisfies ReadonlyArray<{ id: SizePreset; label: string; icon: ReactElement }>

  return (
    <div
      ref={containerRef}
      className="bg-background/80 sticky top-0 z-10 mb-4 flex items-center justify-between gap-2 rounded-md border p-2 backdrop-blur-sm"
    >
      <div className="flex items-center gap-1">
        {sizePresets.map(preset => (
          <Button
            key={preset.id}
            variant={currentSizePreset === preset.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset.id)}
            title={`Set image size to ${preset.label}`}
            className="h-8 px-2.5"
          >
            {preset.icon}
            <span className="ml-1 hidden sm:inline">{preset.label}</span>
          </Button>
        ))}
      </div>
      <span className="text-muted-foreground text-sm font-medium">{imageSize}px</span>
    </div>
  )
}
