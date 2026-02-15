'use client'

import { memo } from 'react'
import { EmptyState as UIEmptyState } from '@/components/ui/empty-state'

const NoteEmptyState = memo(() => (
  <UIEmptyState icon="📝" title="暂无笔记" description="请添加您的第一个笔记" />
))

NoteEmptyState.displayName = 'NoteEmptyState'

export default NoteEmptyState
