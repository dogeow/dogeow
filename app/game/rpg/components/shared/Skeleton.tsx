'use client'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * 基础骨架屏组件
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`bg-muted animate-pulse rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

/**
 * 骨架屏行组件
 */
export function SkeletonLine({
  className = '',
  width,
}: {
  className?: string
  width?: string | number
}) {
  return <Skeleton className={`h-4 ${className}`} style={{ width: width ?? '100%' }} />
}

/**
 * 角色面板骨架屏
 */
export function CharacterPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* 角色信息 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="40%" />
          <SkeletonLine width="60%" />
        </div>
      </div>

      {/* 属性 */}
      <div className="space-y-3">
        <SkeletonLine width="30%" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* 装备 */}
      <div className="space-y-2">
        <SkeletonLine width="20%" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 背包面板骨架屏
 */
export function InventoryPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <SkeletonLine width="30%" />
        <SkeletonLine width="20%" />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[...Array(20)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * 技能面板骨架屏
 */
export function SkillPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <SkeletonLine width="25%" />
        <SkeletonLine width="15%" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-lg" />
            <SkeletonLine width="80%" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 战斗面板骨架屏
 */
export function CombatPanelSkeleton() {
  // 静态骨架屏宽度，模拟不同长度的日志条目
  const widths = ['75%', '85%', '65%', '90%', '80%']

  return (
    <div className="space-y-4">
      {/* 地图选择器 */}
      <Skeleton className="h-10 rounded-lg" />

      {/* 战斗区域 */}
      <Skeleton className="aspect-square rounded-lg" />

      {/* 战斗日志 */}
      <div className="space-y-2">
        <SkeletonLine width="20%" />
        <div className="space-y-2">
          {widths.map((width, i) => (
            <SkeletonLine key={i} width={width} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 商店面板骨架屏
 */
export function ShopPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <SkeletonLine width="30%" />
        <SkeletonLine width="20%" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 rounded-lg" />
            <SkeletonLine width="70%" />
            <SkeletonLine width="40%" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 图鉴面板骨架屏
 */
export function CompendiumPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  )
}
