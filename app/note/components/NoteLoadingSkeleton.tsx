'use client'

import { memo } from 'react'
import { Card } from '@/components/ui/card'

const SKELETON_ITEMS_COUNT = 3

const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: SKELETON_ITEMS_COUNT }, (_, i) => (
      <Card key={i} className="border p-0 dark:border-slate-700">
        <div className="mx-4 mt-4 mb-2 h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-1 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-4 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </Card>
    ))}
  </div>
))

LoadingSkeleton.displayName = 'LoadingSkeleton'

export default LoadingSkeleton
