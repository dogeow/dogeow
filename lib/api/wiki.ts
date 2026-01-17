'use client'

import { apiRequest } from './index'

export interface WikiNode {
  id: number
  title: string
  slug: string
  tags?: string[]
  summary?: string
  content?: string
  content_markdown?: string
}

export interface WikiLink {
  id: number
  source: number | string
  target: number | string
  type?: string
}

export interface WikiGraph {
  nodes: WikiNode[]
  links: WikiLink[]
}

export interface Article {
  title: string
  slug: string
  content?: string
  content_markdown?: string
  html?: string
}

/**
 * 获取完整图谱数据
 */
export const getWikiGraph = async (): Promise<WikiGraph> => {
  const response = await apiRequest<{ nodes: WikiNode[]; links: WikiLink[] }>('notes/graph')
  return {
    nodes: response.nodes || [],
    links: response.links || [],
  }
}

/**
 * 获取文章内容
 */
export const getArticle = async (slug: string): Promise<Article> => {
  return await apiRequest<Article>(`notes/article/${slug}`)
}

/**
 * 创建节点（wiki 节点）
 */
export const createNode = async (data: {
  title: string
  slug?: string
  tags?: string[]
  summary?: string
  content?: string
  content_markdown?: string
}): Promise<{ node: WikiNode }> => {
  return await apiRequest<{ note: WikiNode }>('notes', 'POST', {
    ...data,
    is_wiki: true,
  }).then(response => ({ node: response.note }))
}

/**
 * 更新节点（wiki 节点）
 */
export const updateNode = async (
  id: number,
  data: {
    title?: string
    slug?: string
    tags?: string[]
    summary?: string
    content?: string
    content_markdown?: string
  }
): Promise<{ node: WikiNode }> => {
  return await apiRequest<{ note: WikiNode }>(`notes/${id}`, 'PUT', data).then(response => ({
    node: response.note,
  }))
}

/**
 * 删除节点（wiki 节点）
 */
export const deleteNode = async (id: number): Promise<void> => {
  await apiRequest(`notes/${id}`, 'DELETE')
}

/**
 * 创建链接
 */
export const createLink = async (data: {
  source_id: number
  target_id: number
  type?: string
}): Promise<{ link: WikiLink }> => {
  return await apiRequest<{ link: WikiLink }>('notes/links', 'POST', data)
}

/**
 * 删除链接
 */
export const deleteLink = async (id: number): Promise<void> => {
  await apiRequest(`notes/links/${id}`, 'DELETE')
}
