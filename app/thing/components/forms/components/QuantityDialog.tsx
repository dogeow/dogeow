import React, { memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface QuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onConfirm: () => void
}

export const QuantityDialog = memo<QuantityDialogProps>(
  ({ open, onOpenChange, quantity, onQuantityChange, onConfirm }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置数量</DialogTitle>
            <DialogDescription>设置物品的数量</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="temp-quantity">数量</Label>
              <Input
                id="temp-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => onQuantityChange(e.target.valueAsNumber || 1)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="button" onClick={onConfirm}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

QuantityDialog.displayName = 'QuantityDialog'
