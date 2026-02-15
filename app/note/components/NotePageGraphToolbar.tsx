'use client'

import { memo, useEffect, useState } from 'react'
import { Plus, Link as LinkIcon } from 'lucide-react'

interface GraphViewToolbarProps {
  onNewNode: () => void
  onCreateLink: () => void
}

const GraphViewToolbar = memo(({ onNewNode, onCreateLink }: GraphViewToolbarProps) => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = () => {
      const { isAdminSync } = require('@/lib/auth')
      setIsAdmin(isAdminSync())
    }
    checkAdmin()
  }, [])

  if (!isAdmin) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onNewNode}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white transition-colors hover:bg-green-600"
        title="新建节点"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={onCreateLink}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white transition-colors hover:bg-purple-600"
        title="创建链接"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  )
})

GraphViewToolbar.displayName = 'GraphViewToolbar'

export default GraphViewToolbar
