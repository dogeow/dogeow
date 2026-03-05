'use client'

import React, { memo, useMemo, useState } from 'react'
import { diffLines } from 'diff'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/helpers'

/** 中英文之间自动加空格，便于阅读与 diff */
function keepSpace(str: string): string {
  return str.replace(
    /(?<=[a-zA-Z0-9])(?=[\u4e00-\u9fa5])|(?<=[\u4e00-\u9fa5])(?=[a-zA-Z0-9])/g,
    ' '
  )
}

type DiffLine = { left: string; right: string; type: 'remove' | 'add' | 'same' }

function buildSplitLines(oldText: string, newText: string): DiffLine[] {
  const changes = diffLines(oldText, newText)
  const lines: DiffLine[] = []

  for (const change of changes) {
    const value = change.value
    const lineParts = value.endsWith('\n')
      ? value.slice(0, -1).split('\n')
      : value === ''
        ? []
        : value.split('\n')

    if (change.removed) {
      for (let i = 0; i < lineParts.length; i++) {
        lines.push({ left: lineParts[i] ?? '', right: '', type: 'remove' })
      }
    } else if (change.added) {
      for (let i = 0; i < lineParts.length; i++) {
        lines.push({ left: '', right: lineParts[i] ?? '', type: 'add' })
      }
    } else {
      for (let i = 0; i < lineParts.length; i++) {
        const line = lineParts[i] ?? ''
        lines.push({ left: line, right: line, type: 'same' })
      }
    }
  }

  return lines
}

function DiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="border-border bg-muted/30 flex overflow-auto rounded-md border font-mono text-sm">
      <div className="min-w-0 flex-1 border-r border-border">
        {lines.map((line, i) => (
          <div
            key={`l-${i}`}
            className={cn(
              'whitespace-pre break-all px-3 py-0.5',
              line.type === 'remove' && 'bg-red-500/20 text-red-700 dark:text-red-300'
            )}
          >
            {line.left || '\u00a0'}
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        {lines.map((line, i) => (
          <div
            key={`r-${i}`}
            className={cn(
              'whitespace-pre break-all px-3 py-0.5',
              line.type === 'add' && 'bg-green-500/20 text-green-700 dark:text-green-300'
            )}
          >
            {line.right || '\u00a0'}
          </div>
        ))}
      </div>
    </div>
  )
}

const TextDiffContent: React.FC = () => {
  const [oldValue, setOldValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [addSpace, setAddSpace] = useState(false)

  const handleOldChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setOldValue(addSpace ? keepSpace(v) : v)
  }

  const handleNewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setNewValue(addSpace ? keepSpace(v) : v)
  }

  const toggleSpace = (checked: boolean) => {
    setAddSpace(checked)
    if (checked) {
      if (oldValue) setOldValue(keepSpace(oldValue))
      if (newValue) setNewValue(keepSpace(newValue))
    }
  }

  const diffLinesResult = useMemo(() => buildSplitLines(oldValue, newValue), [oldValue, newValue])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="text-diff-space"
          checked={addSpace}
          onCheckedChange={toggleSpace}
          aria-label="中英文加空格"
        />
        <Label htmlFor="text-diff-space" className="cursor-pointer text-sm font-normal">
          中英文之间加空格
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">原文 / 旧内容</Label>
          <textarea
            value={oldValue}
            placeholder="请输入要对比的旧内容"
            onChange={handleOldChange}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-40 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 md:h-52"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">对比 / 新内容</Label>
          <textarea
            value={newValue}
            placeholder="请输入要对比的新内容"
            onChange={handleNewChange}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-40 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 md:h-52"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">
          对比结果（左：删除/红，右：新增/绿）
        </Label>
        <div className="max-h-[40vh] min-h-[120px] overflow-auto">
          <DiffView lines={diffLinesResult} />
        </div>
      </div>
    </div>
  )
}

const TextDiff = memo(TextDiffContent)
TextDiff.displayName = 'TextDiff'

export default TextDiff
