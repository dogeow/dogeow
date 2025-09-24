'use client'

import { Skeleton } from '@/components/ui/skeleton'

// 优化：提取常量
const SKELETON_ITEMS_COUNT = 6
const USER_SKELETON_COUNT = 5

// 聊天页面骨架屏
export function ChatPageSkeleton() {
  return (
    <div className="bg-background safe-area-top safe-area-bottom flex h-full flex-col">
      {/* Mobile Header Skeleton */}
      <div className="chat-header-mobile flex items-center justify-between border-b p-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-9" />
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Room List Sidebar Skeleton */}
        <div className="bg-muted/30 hidden w-80 border-r lg:flex lg:flex-col">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4">
            <RoomListSkeleton />
          </div>
        </div>

        {/* Main Chat Area Skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="hidden border-b p-4 lg:block">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Skeleton className="mx-auto h-12 w-12 rounded-full" />
              <Skeleton className="mt-4 h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Online Users Sidebar Skeleton */}
        <div className="bg-muted/30 hidden w-80 border-l lg:flex lg:flex-col">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-3">
              {Array.from({ length: USER_SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 房间列表骨架屏
export function RoomListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}
