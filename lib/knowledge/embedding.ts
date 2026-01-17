/**
 * 向量嵌入功能
 * 使用 Ollama 的 embedding 模型生成向量
 */

import { getKnowledgeConfig } from './config'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_EMBEDDING_URL = `${OLLAMA_BASE_URL}/api/embeddings`

export interface EmbeddingResult {
  embedding: number[]
  model: string
}

/**
 * 生成文本的向量嵌入
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getKnowledgeConfig()

  try {
    const response = await fetch(OLLAMA_EMBEDDING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.rag.embeddingModel,
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama embedding API error: ${response.status}`)
    }

    const data = await response.json()
    return data.embedding || []
  } catch (error) {
    console.error('生成向量嵌入失败:', error)
    throw error
  }
}

/**
 * 批量生成向量嵌入
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // 可以并行生成，但要注意 Ollama 的并发限制
  const embeddings = await Promise.all(texts.map(text => generateEmbedding(text)))
  return embeddings
}

/**
 * 计算两个向量的余弦相似度
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('向量维度不匹配')
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
