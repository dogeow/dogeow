import type { NodeData, GraphPalette } from '../types'

interface EnhancedNodeOptions {
  showNodeDetails: boolean
  nodeSize?: number
  activeNodeSize?: number
  neighborNodeSize?: number
}

export const createEnhancedNodeCanvasRenderer = (
  activeNode: NodeData | null,
  hoverNode: NodeData | null,
  neighborIds: Set<string>,
  graphPalette: GraphPalette,
  options: EnhancedNodeOptions = { showNodeDetails: true }
) => {
  return (node: NodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title
    const fontSize = 12 / Math.sqrt(globalScale)
    const isActive = String(activeNode?.id) === String(node.id)
    const isHover = String(hoverNode?.id) === String(node.id)
    const isNeighbor = activeNode && !isActive && neighborIds.has(String(node.id))

    const baseRadius = options.nodeSize || 6
    let radius = baseRadius

    if (isActive) {
      radius = options.activeNodeSize || baseRadius * 1.5
    } else if (isNeighbor) {
      radius = options.neighborNodeSize || baseRadius * 1.2
    }

    // 绘制节点主体
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

    // 添加边框
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = isActive ? graphPalette.nodeActive : graphPalette.border
    ctx.stroke()

    // 绘制标签
    if (globalScale > 0.5) {
      // 只在足够放大时显示文本
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

      // 添加背景矩形提高文字可读性
      const textWidth = ctx.measureText(label).width
      if (options.showNodeDetails) {
        ctx.fillStyle = graphPalette.card + '80' // 50%透明度
        ctx.fillRect(
          (node.x ?? 0) + radius + 2,
          (node.y ?? 0) - fontSize / 2,
          textWidth + 4,
          fontSize
        )

        ctx.fillStyle = isActive
          ? graphPalette.labelActive
          : isNeighbor
            ? graphPalette.labelNeighbor
            : graphPalette.labelDefault
      }

      ctx.fillText(label, (node.x ?? 0) + radius + 4, node.y ?? 0)
    }

    // 如果是激活节点，添加特殊标记
    if (isActive) {
      ctx.beginPath()
      ctx.arc((node.x ?? 0) + radius - 2, (node.y ?? 0) - radius + 2, 3, 0, 2 * Math.PI, false)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = graphPalette.nodeActive
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

export const createEnhancedLinkColorGetter = (
  activeNode: NodeData | null,
  graphPalette: GraphPalette
) => {
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

export const createEnhancedLinkWidthGetter = (activeNode: NodeData | null) => {
  return (link: { source: string | number | NodeData; target: string | number | NodeData }) => {
    const baseWidth = 1.2
    if (!activeNode) return baseWidth
    const s =
      typeof link.source === 'string' || typeof link.source === 'number'
        ? String(link.source)
        : String((link.source as NodeData)?.id)
    const t =
      typeof link.target === 'string' || typeof link.target === 'number'
        ? String(link.target)
        : String((link.target as NodeData)?.id)
    if (s === String(activeNode.id) || t === String(activeNode.id)) return 3
    return baseWidth
  }
}
