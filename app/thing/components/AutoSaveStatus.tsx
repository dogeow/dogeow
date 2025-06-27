import { Check } from "lucide-react"

interface AutoSaveStatusProps {
  autoSaving: boolean
  lastSaved: Date | null
}

export default function AutoSaveStatus({ autoSaving, lastSaved }: AutoSaveStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {autoSaving && (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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