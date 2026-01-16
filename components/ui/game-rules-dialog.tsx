'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

interface GameRulesDialogProps {
  title: string
  rules: string[]
  className?: string
}

export function GameRulesDialog({ title, rules, className = '' }: GameRulesDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`text-primary hover:text-primary/80 p-0 hover:bg-transparent ${className}`}
          title="游戏规则"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="text-primary h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <ul className="space-y-2">
            {rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-medium">•</span>
                <span className="text-gray-700 dark:text-gray-300">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
