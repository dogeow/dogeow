"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface GameRulesDialogProps {
  title: string
  rules: string[]
  className?: string
}

export function GameRulesDialog({ title, rules, className = "" }: GameRulesDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`bg-white hover:bg-gray-50 border-gray-200 shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 ${className}`}
          title="游戏规则"
        >
          <HelpCircle className="h-5 w-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
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