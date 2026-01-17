import { useState, useCallback } from 'react'
import { getArticle } from '@/lib/api/wiki'
import type { ArticlePayload, JSONContent } from '../types'

export function useArticleLoader() {
  const [articleHtml, setArticleHtml] = useState<string>('')
  const [articleRaw, setArticleRaw] = useState<string>('')
  const [articleJson, setArticleJson] = useState<JSONContent | null>(null)
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false)
  const [articleError, setArticleError] = useState<string>('')

  const handleArticlePayload = useCallback((article: ArticlePayload | null) => {
    if (!article) {
      setArticleError('未获取到文章内容')
      setArticleHtml('')
      setArticleRaw('')
      setArticleJson(null)
      return
    }

    let html = (article.html ?? '').trim()
    // 如果 html 看起来像 JSON（以 { 开头），则忽略它，使用其他格式
    if (html && html.startsWith('{')) {
      html = ''
    }
    setArticleHtml(html)

    let markdownOrRaw = article.content_markdown ?? ''
    let parsedJson: JSONContent | null = null

    const rawContent = article.content
    if (!html && rawContent) {
      if (typeof rawContent === 'string') {
        try {
          parsedJson = JSON.parse(rawContent) as JSONContent
        } catch {
          if (!markdownOrRaw) {
            markdownOrRaw = rawContent
          }
        }
      } else if (typeof rawContent === 'object') {
        parsedJson = rawContent as JSONContent
      }
    }

    setArticleJson(parsedJson)
    setArticleRaw(markdownOrRaw || '')

    if (!html && !parsedJson && !markdownOrRaw) {
      setArticleError('文章暂无内容')
    } else {
      setArticleError('')
    }
  }, [])

  const loadArticle = useCallback(
    async (slug: string) => {
      setArticleError('')
      setArticleHtml('')
      setArticleRaw('')
      setArticleJson(null)
      setLoadingArticle(true)
      try {
        const article = await getArticle(slug)
        handleArticlePayload(article)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setArticleError(errorMessage || '加载失败')
      } finally {
        setLoadingArticle(false)
      }
    },
    [handleArticlePayload]
  )

  return {
    articleHtml,
    articleRaw,
    articleJson,
    loadingArticle,
    articleError,
    loadArticle,
    resetArticle: () => {
      setArticleHtml('')
      setArticleRaw('')
      setArticleJson(null)
      setArticleError('')
    },
  }
}
