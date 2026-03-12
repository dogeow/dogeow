'use client'

import * as React from 'react'
import {
  TabsList,
  TabsTrigger,
  type TabsListProps,
  type TabsTriggerProps,
} from '@/components/ui/tabs'
import { cn } from '@/lib/helpers'

export function PillTabsList({ className, ...props }: TabsListProps) {
  return <TabsList className={cn('bg-muted/50 h-11 gap-1 rounded-xl p-1', className)} {...props} />
}

export function PillTabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsTrigger
      className={cn('gap-2 rounded-lg px-5 text-base data-[state=active]:shadow-sm', className)}
      {...props}
    />
  )
}
