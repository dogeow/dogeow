/**
 * 搜索结果项组件
 */
import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock } from 'lucide-react'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'

interface SearchResult {
  id: number | string
  title: string
  content: string
  url: string
  category: string
  isPublic?: boolean
  thumbnail_url?: string | null
}

interface SearchResultItemProps {
  result: SearchResult
  categoryName: string
  onClick: (url: string) => void
}

export function SearchResultItem({ result, categoryName, onClick }: SearchResultItemProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="bg-card hover:bg-accent/50 border-border/50 cursor-pointer rounded-lg border p-3"
      onClick={() => onClick(result.url)}
    >
      <div className="flex gap-3">
        {/* 图片区域 */}
        {result.thumbnail_url && !imageError ? (
          <div className="flex-shrink-0">
            <Image
              src={result.thumbnail_url}
              alt={result.title}
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : result.thumbnail_url && imageError ? (
          <div className="bg-muted flex h-16 w-16 flex-shrink-0 items-center justify-center rounded">
            <ImagePlaceholder className="text-muted-foreground h-6 w-6 opacity-40" />
          </div>
        ) : null}

        {/* 内容区域 */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
    </div>
  )
}
