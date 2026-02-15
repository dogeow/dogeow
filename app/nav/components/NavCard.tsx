'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { NavItem } from '@/app/nav/types'
import { useNavStore } from '@/app/nav/stores/navStore'
import { AlertTriangleIcon } from 'lucide-react'
import NavCardActions from './NavCardActions'

interface NavCardProps {
  item: NavItem
  highlight?: string
}

export function NavCard({ item, highlight }: NavCardProps) {
  const { recordClick, deleteItem } = useNavStore()

  // 高亮文本
  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-inherit">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // 记录点击
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      visitSite()
    }
  }

  // 访问网站
  const visitSite = async () => {
    try {
      await recordClick(item.id)

      // 在新窗口打开链接
      if (item.is_new_window) {
        window.open(item.url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = item.url
      }
    } catch (error) {
      console.error('访问失败:', error)
    }
  }

  // Edit and delete handlers are now in NavCardActions

  return (
    <>
      <Card className="overflow-hidden py-1 transition-shadow hover:shadow-md">
        <CardContent className="relative flex items-center p-3">
          <div className="mr-3 flex-shrink-0">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md">
              {item.icon ? (
                <Image
                  src={item.icon}
                  alt={`${item.name} 图标`}
                  width={32}
                  height={32}
                  className="max-h-full max-w-full"
                />
              ) : (
                <AlertTriangleIcon className="h-1/2 w-1/2 opacity-50" />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-grow">
            <a
              href={item.url}
              target={item.is_new_window ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={handleClick}
              className="block"
            >
              <h3 className="truncate text-base font-medium">
                {highlightText(item.name, highlight)}
              </h3>
              {item.description && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {highlightText(item.description, highlight)}
                </p>
              )}
            </a>
          </div>
          <div className="absolute top-2 right-2">
            <NavCardActions item={item} deleteItem={deleteItem} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
