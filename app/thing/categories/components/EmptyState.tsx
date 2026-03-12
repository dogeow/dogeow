import React, { memo } from 'react'

const EmptyState = memo(() => {
  return (
    <div className="text-muted-foreground py-8 text-center">
      <div className="mb-2 text-lg">暂无分类</div>
    </div>
  )
})

EmptyState.displayName = 'EmptyState'

export default EmptyState
