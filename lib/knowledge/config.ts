/**
 * 知识库配置
 */

export type KnowledgeSearchMethod = 'simple' | 'rag'

export interface KnowledgeConfig {
  // 搜索方法：'simple' 使用关键词匹配，'rag' 使用向量检索
  searchMethod: KnowledgeSearchMethod
  // RAG 相关配置
  rag: {
    // 向量模型
    embeddingModel: string
    // 向量维度
    embeddingDimension: number
    // 检索的文档数量
    topK: number
    // 相似度阈值
    similarityThreshold: number
  }
}

// 默认配置
export const defaultKnowledgeConfig: KnowledgeConfig = {
  searchMethod: (process.env.KNOWLEDGE_SEARCH_METHOD as KnowledgeSearchMethod) || 'rag',
  rag: {
    embeddingModel: process.env.KNOWLEDGE_EMBEDDING_MODEL || 'nomic-embed-text',
    embeddingDimension: 768, // nomic-embed-text 的维度
    topK: 5,
    similarityThreshold: 0.3, // 相似度阈值，低于此值的结果会被过滤
  },
}

// 获取当前配置
export function getKnowledgeConfig(): KnowledgeConfig {
  return defaultKnowledgeConfig
}
