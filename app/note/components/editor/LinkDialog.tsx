import React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LinkDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  linkText: string
  setLinkText: (text: string) => void
  linkUrl: string
  setLinkUrl: (url: string) => void
  onInsert: () => void
}

const LinkDialog = ({
  isOpen,
  onOpenChange,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  onInsert
}: LinkDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>插入链接</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">链接文本</label>
            <Input
              placeholder="显示文本"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button 
            onClick={onInsert}
            disabled={!linkUrl.trim()}
          >
            插入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LinkDialog 