/**
 * RAG 搜索功能
 * 使用向量检索增强生成
 */

import { loadAllDocuments } from './search'
import { searchSimilarDocuments, buildVectorIndex, loadVectorIndex } from './vector-store'
import { getKnowledgeConfig } from './config'

export interface RAGSearchResult {
  doc: {
    title: string
    slug: string
    content: string
  }
  snippet: string
  similarity: number
}

/**
 * RAG 搜索相关文档
 */
export async function searchWithRAG(query: string, topK: number = 5): Promise<RAGSearchResult[]> {
  const config = getKnowledgeConfig()

  // 检查向量索引是否存在
  let index = loadVectorIndex()

  // 如果索引不存在，构建新索引
  if (!index) {
    console.log('[RAG搜索] 向量索引不存在，开始构建...')
    const documents = await loadAllDocuments()
    if (documents.length === 0) {
      console.warn('[RAG搜索] 没有找到任何文档')
      return []
    }

    index = await buildVectorIndex(documents)
    // 保存索引
    const { saveVectorIndex } = await import('./vector-store')
    saveVectorIndex(index)
  }

  // 对于通用查询（如"知识库有什么内容"），返回所有文档
  const isGeneralQuery = /知识库|内容|有什么|哪些|包含/.test(query.toLowerCase())
  if (isGeneralQuery && index.documents.length > 0) {
    // 返回所有唯一的文档（按 slug 去重）
    const uniqueDocs = new Map<string, RAGSearchResult>()
    for (const vecDoc of index.documents) {
      if (!uniqueDocs.has(vecDoc.slug)) {
        uniqueDocs.set(vecDoc.slug, {
          doc: {
            title: vecDoc.title,
            slug: vecDoc.slug,
            content: vecDoc.content,
          },
          snippet: vecDoc.content.substring(0, 200), // 只显示前200字符
          similarity: 1.0, // 通用查询给最高相似度
        })
      }
    }
    return Array.from(uniqueDocs.values()).slice(0, topK)
  }

  // 搜索相似文档
  const results = await searchSimilarDocuments(query, topK)

  // 转换为 RAGSearchResult 格式
  return results.map(result => ({
    doc: {
      title: result.doc.title,
      slug: result.doc.slug,
      content: result.doc.content,
    },
    snippet: result.doc.content,
    similarity: result.similarity,
  }))
}

/**
 * 检查并更新向量索引（如果文档有变化）
 */
export async function ensureVectorIndex(): Promise<void> {
  const index = loadVectorIndex()
  if (!index) {
    console.log('[RAG] 向量索引不存在，需要构建')
    return
  }

  // 可以在这里添加检查逻辑，判断是否需要更新索引
  // 例如：比较文档的修改时间等
  console.log('[RAG] 向量索引已存在')
}
