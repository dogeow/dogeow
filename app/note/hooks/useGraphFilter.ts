import { useMemo } from 'react'
import type { NodeData, LinkData } from '../types/graph'

export function useGraphFilter(
  nodes: NodeData[],
  links: LinkData[],
  query: string,
  showNeighborsOnly: boolean,
  activeNode: NodeData | null
) {
  // 缓存邻居节点集合，避免在 nodeCanvasObject 中重复计算
  const neighborIds = useMemo(() => {
    if (!activeNode) return new Set<string>()
    const activeId = String(activeNode.id)
    const ids = new Set<string>([activeId])
    for (const link of links) {
      const s =
        typeof link.source === 'string' || typeof link.source === 'number'
          ? String(link.source)
          : String((link.source as NodeData).id)
      const t =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData).id)
      if (s === activeId) ids.add(t)
      if (t === activeId) ids.add(s)
    }
    return ids
  }, [activeNode, links])

  const filtered = useMemo(() => {
    // 如果启用"仅显示邻居"且已选中节点，只显示该节点及其直接邻居
    if (showNeighborsOnly && activeNode) {
      const fNodes = nodes.filter(n => neighborIds.has(String(n.id)))
      const fSet = new Set(fNodes.map(n => String(n.id)))
      const fLinks = links.filter(l => {
        const s =
          typeof l.source === 'string' || typeof l.source === 'number'
            ? String(l.source)
            : String((l.source as NodeData).id)
        const t =
          typeof l.target === 'string' || typeof l.target === 'number'
            ? String(l.target)
            : String((l.target as NodeData).id)
        return fSet.has(s) && fSet.has(t)
      })
      return { nodes: fNodes, links: fLinks }
    }

    // 搜索过滤：显示匹配节点及其直接邻居，使连接完整可见
    if (!query.trim()) return { nodes, links }
    const q = query.toLowerCase()
    const matchedIds = new Set<string>()

    // 找出所有匹配的节点
    for (const n of nodes) {
      const text =
        `${n.title} ${n.slug} ${(n.tags || []).join(' ')} ${n.summary || ''}`.toLowerCase()
      if (text.includes(q)) matchedIds.add(String(n.id))
    }

    // 找出匹配节点的所有邻居（包括连接的节点）
    const neighborIds = new Set<string>(matchedIds)
    for (const link of links) {
      const s =
        typeof link.source === 'string' || typeof link.source === 'number'
          ? String(link.source)
          : String((link.source as NodeData).id)
      const t =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData).id)
      if (matchedIds.has(s)) neighborIds.add(t)
      if (matchedIds.has(t)) neighborIds.add(s)
    }

    // 过滤节点：包含匹配节点和它们的邻居
    const fNodes = nodes.filter(n => neighborIds.has(String(n.id)))
    const fSet = new Set(fNodes.map(n => String(n.id)))

    // 过滤链接：只显示连接这些节点的完整链接
    const fLinks = links.filter(l => {
      const s =
        typeof l.source === 'string' || typeof l.source === 'number'
          ? String(l.source)
          : String((l.source as NodeData).id)
      const t =
        typeof l.target === 'string' || typeof l.target === 'number'
          ? String(l.target)
          : String((l.target as NodeData).id)
      return fSet.has(s) && fSet.has(t)
    })

    return { nodes: fNodes, links: fLinks }
  }, [nodes, links, query, showNeighborsOnly, activeNode])

  return { filtered, neighborIds }
}
