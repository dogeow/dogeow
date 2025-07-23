import { Check } from 'lucide-react'

interface AutoSaveStatusProps {
  autoSaving: boolean
  lastSaved: Date | null
}

export default function AutoSaveStatus({ autoSaving, lastSaved }: AutoSaveStatusProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      {autoSaving && (
        <>
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
          <span>正在保存...</span>
        </>
      )}
      {lastSaved && !autoSaving && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span>已保存 {new Date(lastSaved).toLocaleTimeString()}</span>
        </>
      )}
    </div>
  )
}
