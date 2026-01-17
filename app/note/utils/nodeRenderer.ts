import type { NodeData, GraphPalette } from '../types/graph'

export const createNodeCanvasRenderer = (
  activeNode: NodeData | null,
  hoverNode: NodeData | null,
  neighborIds: Set<string>,
  graphPalette: GraphPalette
) => {
  return (node: NodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title
    const fontSize = 12 / Math.sqrt(globalScale)
    const isActive = String(activeNode?.id) === String(node.id)
    const isHover = String(hoverNode?.id) === String(node.id)

    // 使用缓存的邻居集合，避免重复遍历
    const isNeighbor = activeNode && !isActive && neighborIds.has(String(node.id))

    const radius = 4
    ctx.beginPath()
    ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false)

    if (isActive) {
      ctx.fillStyle = graphPalette.nodeActive
    } else if (isNeighbor) {
      ctx.fillStyle = graphPalette.nodeNeighbor
    } else if (isHover) {
      ctx.fillStyle = graphPalette.nodeHover
    } else {
      ctx.fillStyle = graphPalette.nodeDefault
    }
    ctx.fill()

    ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    if (isActive) {
      ctx.fillStyle = graphPalette.labelActive
    } else if (isNeighbor) {
      ctx.fillStyle = graphPalette.labelNeighbor
    } else {
      ctx.fillStyle = graphPalette.labelDefault
    }
    ctx.fillText(label, (node.x ?? 0) + 6, node.y ?? 0)
  }
}

export const createLinkColorGetter = (activeNode: NodeData | null, graphPalette: GraphPalette) => {
  return (link: { source: string | number | NodeData; target: string | number | NodeData }) => {
    if (!activeNode) return graphPalette.linkMuted
    const s =
      typeof link.source === 'string' || typeof link.source === 'number'
        ? String(link.source)
        : String((link.source as NodeData)?.id)
    const t =
      typeof link.target === 'string' || typeof link.target === 'number'
        ? String(link.target)
        : String((link.target as NodeData)?.id)
    if (s === String(activeNode.id) || t === String(activeNode.id)) {
      return graphPalette.linkActive
    }
    return graphPalette.linkMuted
  }
}

export const createLinkWidthGetter = (activeNode: NodeData | null) => {
  return (link: { source: string | number | NodeData; target: string | number | NodeData }) => {
    const mutedWidth = 0.7
    if (!activeNode) return mutedWidth
    const s =
      typeof link.source === 'string' || typeof link.source === 'number'
        ? String(link.source)
        : String((link.source as NodeData)?.id)
    const t =
      typeof link.target === 'string' || typeof link.target === 'number'
        ? String(link.target)
        : String((link.target as NodeData)?.id)
    if (s === String(activeNode.id) || t === String(activeNode.id)) return 3
    return mutedWidth
  }
}
