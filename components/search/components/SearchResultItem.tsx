/**
 * 搜索结果项组件
 */
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock } from 'lucide-react'

interface SearchResult {
  id: number | string
  title: string
  content: string
  url: string
  category: string
  isPublic?: boolean
}

interface SearchResultItemProps {
  result: SearchResult
  categoryName: string
  onClick: (url: string) => void
}

export function SearchResultItem({ result, categoryName, onClick }: SearchResultItemProps) {
  return (
    <div
      className="bg-card hover:bg-accent/50 border-border/50 cursor-pointer space-y-2 rounded-lg border p-3"
      onClick={() => onClick(result.url)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm leading-tight font-medium">{result.title}</h3>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="flex-shrink-0 text-xs whitespace-nowrap">
              {categoryName}
            </Badge>
            {result.category === 'thing' && 'isPublic' in result && (
              <Badge
                variant={result.isPublic ? 'secondary' : 'default'}
                className="flex items-center gap-1 text-xs"
              >
                {result.isPublic ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {result.isPublic ? '公开' : '私有'}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {result.content}
        </p>
      </div>
    </div>
  )
}
