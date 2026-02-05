import { memo } from 'react'
import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TileSize } from '@/stores/homeLayoutStore'

interface TileSizeMenuProps {
  currentSize: TileSize
  onSizeChange: (size: TileSize) => void
}

const SIZE_OPTIONS: { value: TileSize; label: string }[] = [
  { value: '1x1', label: '小 (1×1)' },
  { value: '1x2', label: '高 (1×2)' },
  { value: '2x1', label: '宽 (2×1)' },
  { value: '3x1', label: '超宽 (3×1)' },
]

export const TileSizeMenu = memo(({ currentSize, onSizeChange }: TileSizeMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={e => {
          e.stopPropagation()
        }}
        onPointerDown={e => {
          e.stopPropagation()
        }}
      >
        <button
          className="absolute top-2 right-2 z-[4] flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
          aria-label="更改卡片大小"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        {SIZE_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={e => {
              e.stopPropagation()
              if (option.value !== currentSize) {
                onSizeChange(option.value)
              }
            }}
            className={option.value === currentSize ? 'bg-accent' : ''}
          >
            {option.label}
            {option.value === currentSize && ' ✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

TileSizeMenu.displayName = 'TileSizeMenu'
