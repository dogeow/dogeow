/**
 * 向量存储系统
 * 使用文件系统存储向量索引
 */

import fs from 'node:fs'
import path from 'node:path'
import { Document } from './search'
import { generateEmbedding } from './embedding'
import { getKnowledgeConfig } from './config'

export interface VectorDocument {
  id: string
  title: string
  slug: string
  content: string
  embedding: number[]
  metadata: {
    source: 'file' | 'database'
    chunkIndex?: number
  }
}

interface VectorIndex {
  version: string
  createdAt: string
  updatedAt: string
  documents: VectorDocument[]
}

const VECTOR_INDEX_DIR = path.join(process.cwd(), '.knowledge')
const VECTOR_INDEX_FILE = path.join(VECTOR_INDEX_DIR, 'vector-index.json')

/**
 * 确保索引目录存在
 */
function ensureIndexDir(): void {
  if (!fs.existsSync(VECTOR_INDEX_DIR)) {
    fs.mkdirSync(VECTOR_INDEX_DIR, { recursive: true })
  }
}

/**
 * 加载向量索引
 */
export function loadVectorIndex(): VectorIndex | null {
  try {
    if (!fs.existsSync(VECTOR_INDEX_FILE)) {
      return null
    }

    const content = fs.readFileSync(VECTOR_INDEX_FILE, 'utf8')
    return JSON.parse(content) as VectorIndex
  } catch (error) {
    console.error('加载向量索引失败:', error)
    return null
  }
}

/**
 * 保存向量索引
 */
export function saveVectorIndex(index: VectorIndex): void {
  try {
    ensureIndexDir()
    fs.writeFileSync(VECTOR_INDEX_FILE, JSON.stringify(index, null, 2), 'utf8')
  } catch (error) {
    console.error('保存向量索引失败:', error)
    throw error
  }
}

/**
 * 将文档分块（用于长文档）
 */
function chunkDocument(doc: Document, chunkSize: number = 1000, overlap: number = 200): string[] {
  const content = doc.content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '') // 移除 frontmatter
  const chunks: string[] = []

  // 按段落分割
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  let currentChunk = ''
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // 保留重叠部分
      const words = currentChunk.split(/\s+/)
      const overlapText = words.slice(-Math.floor(overlap / 10)).join(' ')
      currentChunk = overlapText + '\n\n' + para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  // 如果文档很短，直接返回整个内容
  if (chunks.length === 0) {
    return [content]
  }

  return chunks
}

/**
 * 构建向量索引
 */
export async function buildVectorIndex(documents: Document[]): Promise<VectorIndex> {
  console.log(`[向量索引] 开始构建索引，文档数量: ${documents.length}`)

  const vectorDocs: VectorDocument[] = []
  const config = getKnowledgeConfig()

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]
    console.log(`[向量索引] 处理文档 ${i + 1}/${documents.length}: ${doc.title}`)

    // 将文档分块
    const chunks = chunkDocument(doc, 1000, 200)

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]

      try {
        // 生成向量嵌入
        const embedding = await generateEmbedding(chunk)

        vectorDocs.push({
          id: `${doc.slug}-${chunkIndex}`,
          title: doc.title,
          slug: doc.slug,
          content: chunk,
          embedding,
          metadata: {
            source: doc.source,
            chunkIndex,
          },
        })

        // 添加延迟，避免 Ollama 过载
        if ((i * chunks.length + chunkIndex) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.warn(`[向量索引] 文档 ${doc.title} 块 ${chunkIndex} 生成向量失败:`, error)
      }
    }
  }

  const index: VectorIndex = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documents: vectorDocs,
  }

  console.log(`[向量索引] 索引构建完成，共 ${vectorDocs.length} 个向量文档`)
  return index
}

/**
 * 计算余弦相似度（内部函数）
 */
function cosineSimilarityInternal(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return 0
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * 搜索相似文档
 */
export async function searchSimilarDocuments(
  query: string,
  topK: number = 5
): Promise<Array<{ doc: VectorDocument; similarity: number }>> {
  const index = loadVectorIndex()
  if (!index || index.documents.length === 0) {
    console.warn('[向量搜索] 向量索引不存在或为空')
    return []
  }

  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query)

    // 计算相似度
    const results = index.documents
      .map(doc => ({
        doc,
        similarity: cosineSimilarityInternal(queryEmbedding, doc.embedding),
      }))
      .filter(result => result.similarity > 0) // 过滤掉相似度为 0 的结果
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    console.log(`[向量搜索] 查询: "${query}", 找到 ${results.length} 个相似文档`)
    return results
  } catch (error) {
    console.error('[向量搜索] 搜索失败:', error)
    return []
  }
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return 0
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

// 导出供其他模块使用
export { cosineSimilarity }
