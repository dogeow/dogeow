'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, Globe, FileText } from 'lucide-react'

interface NewsItem {
  id: number
  title_original: string
  title_chinese: string
  summary_chinese: string
  source_url: string
  category: string
  created_at: string
  updated_at?: string
}

interface NewsDisplayProps {
  news: NewsItem[]
  category?: 'domestic' | 'international'
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({ news, category }) => {
  if (!news || news.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {category === 'domestic'
              ? '国内新闻'
              : category === 'international'
                ? '国际新闻'
                : '最新新闻'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">暂无新闻数据</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {category === 'domestic'
            ? '国内新闻'
            : category === 'international'
              ? '国际新闻'
              : '最新新闻'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {news.map(item => (
            <article
              key={item.id}
              className="hover:bg-accent/5 border-b pb-6 transition-colors duration-200 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between">
                <h3 className="mb-2 pr-2 text-lg leading-tight font-semibold">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {item.title_chinese || item.title_original}
                    <ExternalLink className="h-4 w-4 opacity-60" />
                  </a>
                </h3>
                <Badge variant="outline" className="shrink-0">
                  {item.category === 'domestic' ? '国内' : '国际'}
                </Badge>
              </div>

              <p className="text-muted-foreground mb-3 leading-relaxed">
                {item.summary_chinese || '暂无摘要'}
              </p>

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(item.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>来源: {new URL(item.source_url).hostname}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default NewsDisplay
