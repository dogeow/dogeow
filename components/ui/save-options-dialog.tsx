import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SaveOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onSaveDraft: () => void;
  onSave: () => void;
  onDiscard: () => void;
  saveDraftText?: string;
  saveText?: string;
  discardText?: string;
}

export function SaveOptionsDialog({
  open,
  onOpenChange,
  title,
  description,
  onSaveDraft,
  onSave,
  onDiscard,
  saveDraftText = "保存草稿",
  saveText = "保存",
  discardText = "放弃保存"
}: SaveOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={onSaveDraft}
            variant="default"
            className="w-full"
          >
            {saveDraftText}
          </Button>
          <Button 
            onClick={onSave}
            variant="secondary"
            className="w-full"
          >
            {saveText}
          </Button>
          <Button 
            onClick={onDiscard}
            variant="outline"
            className="w-full"
          >
            {discardText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 