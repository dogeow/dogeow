import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface LoadingStateProps {
  onBack: () => void
}

export default function LoadingState({ onBack }: LoadingStateProps) {
  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex h-64 items-center justify-center">
        <p>加载中...</p>
      </div>
    </div>
  )
}
