import fs from 'node:fs'
import path from 'node:path'
import { getWikiContentDir, readArticleSourceBySlug, getArticleSlugs } from '../wiki/mdx'
import { extractTextFromJSON } from '../helpers/wordCount'

export interface Document {
  title: string
  slug: string
  content: string
  source: 'file' | 'database'
}

/**
 * 从本地文件系统读取所有文档
 */
export async function loadDocumentsFromFiles(): Promise<Document[]> {
  const documents: Document[] = []
  const slugs = getArticleSlugs()

  console.log(`[文档加载] 找到 ${slugs.length} 个文档文件:`, slugs)

  for (const slug of slugs) {
    try {
      const content = await readArticleSourceBySlug(slug)

      // 提取 frontmatter 中的 title，如果没有 frontmatter，使用第一行作为标题
      let title = slug
      const frontmatterMatch = content.match(/^---\s*\n(?:.*\n)*?title:\s*(.+?)\n/)
      if (frontmatterMatch) {
        title = frontmatterMatch[1].trim().replace(/^["']|["']$/g, '')
      } else {
        // 如果没有 frontmatter，使用第一行非空内容作为标题
        const firstLine = content.split('\n').find(line => line.trim().length > 0)
        if (firstLine) {
          title = firstLine.trim().replace(/^#+\s*/, '') // 移除 markdown 标题标记
        }
      }

      documents.push({
        title,
        slug,
        content,
        source: 'file',
      })

      console.log(`[文档加载] 已加载: ${slug} -> ${title}`)
    } catch (error) {
      console.warn(`Failed to load document ${slug}:`, error)
    }
  }

  console.log(`[文档加载] 总共加载了 ${documents.length} 个文档`)
  return documents
}

/**
 * 从数据库加载文档（通过 API）
 * 注意：在服务端运行时，需要确保 API URL 可访问
 */
export async function loadDocumentsFromDatabase(): Promise<Document[]> {
  try {
    // 在服务端，优先使用内部 URL，避免网络问题
    let apiBaseUrl =
      process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

    // 确保 URL 以 /api 结尾（如果环境变量是基础 URL）
    if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
      apiBaseUrl = apiBaseUrl.endsWith('/') ? `${apiBaseUrl}api` : `${apiBaseUrl}/api`
    }

    console.log(`[文档加载] API URL: ${apiBaseUrl}`)
    const apiUrl = `${apiBaseUrl}/notes/wiki/articles`
    console.log(`[文档加载] 请求 URL: ${apiUrl}`)

    // 使用批量接口一次性获取所有文章内容，提高性能
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[文档加载] 请求失败: ${response.status} ${response.statusText}`)
      console.error(`[文档加载] 错误内容: ${errorText}`)
      return []
    }

    const data = await response.json()
    console.log(`[文档加载] 原始响应数据结构:`, {
      hasData: !!data.data,
      hasArticles: !!data.articles,
      message: data.message,
      articlesCount: data.data?.articles?.length || data.articles?.length || 0,
    })

    const articles = data.data?.articles || data.articles || []
    console.log(`[文档加载] 解析到的文章数量: ${articles.length}`)

    // 处理每个文章的内容
    const documents: Document[] = []
    for (const article of articles) {
      try {
        const contentMarkdown = article.content_markdown || ''
        const rawContent = article.content || ''

        // 优先使用 content_markdown，如果为空且 content 是 JSON 格式，提取文本
        let content = contentMarkdown

        if (!content && rawContent) {
          try {
            // 尝试解析 JSON 格式的 content
            const parsedContent =
              typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
            const extractedText = extractTextFromJSON(parsedContent)
            if (extractedText) {
              content = extractedText
              console.log(
                `[文档加载] 从 JSON 提取文本: ${article.slug} -> ${extractedText.substring(0, 50)}...`
              )
            } else {
              // 如果提取失败，使用原始内容（可能是纯文本）
              content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
            }
          } catch (e) {
            // 如果不是有效的 JSON，使用原始内容作为纯文本
            content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
            console.log(
              `[文档加载] 非 JSON 内容: ${article.slug} -> ${content.substring(0, 50)}...`
            )
          }
        }

        if (content) {
          documents.push({
            title: article.title,
            slug: article.slug,
            content,
            source: 'database',
          })
          console.log(
            `[文档加载] 已加载文档: ${article.title} (${article.slug}), 内容长度: ${content.length}`
          )
        } else {
          console.warn(`[文档加载] 文档 ${article.slug} 没有可用内容`)
        }
      } catch (error) {
        console.warn(`Failed to process article ${article.slug}:`, error)
      }
    }

    console.log(`[文档加载] 总共加载了 ${documents.length} 个文档`)
    return documents
  } catch (error) {
    console.warn('Failed to load documents from database:', error)
    return []
  }
}

/**
 * 加载所有文档（仅从数据库）
 */
export async function loadAllDocuments(): Promise<Document[]> {
  // 使用数据库方案，只从数据库加载文档
  const dbDocs = await loadDocumentsFromDatabase()

  return dbDocs
}

/**
 * 简单的关键词匹配评分（支持中文）
 */
function calculateRelevanceScore(query: string, doc: Document): number {
  const queryLower = query.toLowerCase().trim()

  // 中文分词：提取所有可能的词（2个字符以上）
  const chineseWords: string[] = []
  const englishWords: string[] = []

  // 提取中文字符（2个字符以上）
  const chineseMatches = queryLower.match(/[\u4e00-\u9fa5]{2,}/g) || []
  chineseWords.push(...chineseMatches)

  // 提取英文单词（2个字符以上）
  const englishMatches = queryLower.match(/[a-z]{2,}/gi) || []
  englishWords.push(...englishMatches)

  // 如果没有提取到词，使用整个查询
  const allQueryWords =
    chineseWords.length > 0 || englishWords.length > 0
      ? [...chineseWords, ...englishWords]
      : [queryLower]

  let score = 0
  const titleLower = doc.title.toLowerCase()
  const contentLower = doc.content.toLowerCase()

  // 标题完全匹配（整个查询）
  if (titleLower.includes(queryLower)) {
    score += 20
  }

  // 标题包含查询词
  for (const word of allQueryWords) {
    if (word.length >= 2 && titleLower.includes(word)) {
      score += 8
    }
  }

  // 内容匹配
  for (const word of allQueryWords) {
    if (word.length >= 2) {
      const matches = (
        contentLower.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
      ).length
      score += matches * 0.5
    }
  }

  // 标签匹配（如果有）
  const tagMatch = doc.content.match(/tags:\s*\[(.*?)\]/i)
  if (tagMatch) {
    const tags = tagMatch[1].toLowerCase()
    for (const word of allQueryWords) {
      if (word.length >= 2 && tags.includes(word)) {
        score += 5
      }
    }
  }

  // 如果查询包含"知识库"、"内容"等通用词，降低评分要求
  const genericWords = ['知识库', '内容', '有什么', '哪些', '包含']
  const hasGenericWord = genericWords.some(w => queryLower.includes(w))

  // 如果有通用词，降低评分阈值（让更多文档被选中）
  if (hasGenericWord && score === 0) {
    // 对于"知识库有什么内容"这类问题，返回所有文档
    score = 1
  }

  return score
}

/**
 * 提取文档的相关片段（包含查询关键词的段落）
 */
function extractRelevantSnippets(doc: Document, query: string, maxLength: number = 2000): string {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1)
  const content = doc.content

  // 移除 frontmatter
  const contentWithoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')

  // 如果文档较短，直接返回
  if (contentWithoutFrontmatter.length <= maxLength) {
    return contentWithoutFrontmatter
  }

  // 按段落分割
  const paragraphs = contentWithoutFrontmatter.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  // 找到包含关键词的段落
  const relevantParagraphs: string[] = []
  let totalLength = 0

  for (const para of paragraphs) {
    const paraLower = para.toLowerCase()
    const hasKeyword = queryWords.some(word => paraLower.includes(word))

    if (hasKeyword && totalLength + para.length <= maxLength) {
      relevantParagraphs.push(para)
      totalLength += para.length
    }
  }

  // 如果找到了相关段落，返回它们
  if (relevantParagraphs.length > 0) {
    return relevantParagraphs.join('\n\n')
  }

  // 否则返回文档开头部分
  return contentWithoutFrontmatter.substring(0, maxLength)
}

/**
 * 搜索相关文档
 */
export async function searchDocuments(
  query: string,
  limit: number = 5
): Promise<Array<{ doc: Document; snippet: string; score: number }>> {
  const documents = await loadAllDocuments()

  console.log(`[文档搜索] 加载了 ${documents.length} 个文档，搜索查询: "${query}"`)

  if (documents.length === 0) {
    console.warn('[文档搜索] 没有找到任何文档')
    return []
  }

  // 计算相关性评分
  const scored = documents.map(doc => ({
    doc,
    score: calculateRelevanceScore(query, doc),
  }))

  // 按评分排序
  const sortedDocs = scored.sort((a, b) => b.score - a.score)

  // 对于"知识库有什么内容"这类通用问题，返回所有文档（最多limit个）
  const queryLower = query.toLowerCase()
  const isGeneralQuery = ['知识库', '内容', '有什么', '哪些', '包含'].some(w =>
    queryLower.includes(w)
  )

  const topDocs = isGeneralQuery
    ? sortedDocs.slice(0, limit) // 通用查询：返回评分最高的N个
    : sortedDocs.filter(item => item.score > 0).slice(0, limit) // 具体查询：只返回有评分的

  console.log(
    `[文档搜索] 找到 ${topDocs.length} 个相关文档，评分:`,
    topDocs.map(t => ({ title: t.doc.title, score: t.score }))
  )

  // 提取相关片段
  return topDocs.map(({ doc, score }) => ({
    doc,
    snippet: extractRelevantSnippets(doc, query),
    score,
  }))
}
