import React from 'react'
import { Editor } from 'slate'
import { useSlate } from 'slate-react'
import { Bold, Italic, Code, List, ListOrdered, Link, Table, Square, Save } from 'lucide-react'
import { Button } from "@/components/ui/button"
import ToolbarButton from './ToolbarButton'

interface EditorToolbarProps {
  onSave: () => void
  onLinkDialogOpen: () => void
  onInsertCodeBlock: () => void
  onInsertTable: () => void
  isSaving: boolean
  disabled: boolean
}

const EditorToolbar = ({
  onSave,
  onLinkDialogOpen,
  onInsertCodeBlock,
  onInsertTable,
  isSaving,
  disabled
}: EditorToolbarProps) => {
  const editor = useSlate()

  return (
    <div className="bg-muted/30 p-2 border-b flex flex-wrap gap-1">
      <ToolbarButton format="bold" icon={Bold} tooltip="粗体 (Ctrl+B)" />
      <ToolbarButton format="italic" icon={Italic} tooltip="斜体 (Ctrl+I)" />
      <ToolbarButton format="code" icon={Code} tooltip="代码 (Ctrl+`)" />
      <div className="w-px h-8 bg-border mx-1"></div>
      
      <ToolbarButton format="bulleted-list" icon={List} tooltip="无序列表" />
      <ToolbarButton format="numbered-list" icon={ListOrdered} tooltip="有序列表" />
      <div className="w-px h-8 bg-border mx-1"></div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onLinkDialogOpen}
        title="插入链接 (Ctrl+K)"
        className="h-9 w-9"
      >
        <Link className="h-5 w-5" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onInsertCodeBlock}
        title="插入代码块"
        className="h-9 w-9"
      >
        <Square className="h-5 w-5" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onInsertTable}
        title="插入表格"
        className="h-9 w-9"
      >
        <Table className="h-5 w-5" />
      </Button>
      
      <div className="ml-auto flex items-center gap-1">
        <Button 
          variant="default" 
          size="sm" 
          onClick={onSave}
          disabled={isSaving || disabled}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}

export default EditorToolbar 