'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check } from 'lucide-react'
import { cn } from '@/lib/helpers'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface BottomHourPickerProps {
  value: number
  onChange: (hour: number) => void
  label: string
  title?: string
  /** 用于区分同一页多个 picker 的 id，避免重复 */
  id?: string
  className?: string
}

export function BottomHourPicker({
  value,
  onChange,
  label,
  title,
  id = 'hour-picker',
  className,
}: BottomHourPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (hour: number) => {
    onChange(hour)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        className={cn(
          'border-input bg-background flex min-w-[5rem] items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
          className
        )}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{String(value).padStart(2, '0')}:00</span>
        <span className="text-muted-foreground text-xs" aria-hidden>
          ▼
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-x-0 border-t p-0 pb-[env(safe-area-inset-bottom)]"
          aria-describedby={undefined}
        >
          <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 pr-12 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <p className="text-foreground text-center font-medium">{title ?? label}</p>
          </div>
          <ScrollArea className="h-[min(50vh,320px)]">
            <div className="py-2">
              {HOURS.map(hour => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleSelect(hour)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3 text-left text-base transition-colors active:bg-muted',
                    value === hour ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/70'
                  )}
                >
                  <span>{String(hour).padStart(2, '0')}:00</span>
                  {value === hour && <Check className="h-5 w-5 shrink-0" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
