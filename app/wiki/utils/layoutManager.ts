import type { NodeData, LinkData } from '../types'

interface LayoutResult {
  nodes: NodeData[]
  links: LinkData[]
}

export class LayoutManager {
  static applyForceLayout(nodes: NodeData[], links: LinkData[]): LayoutResult {
    // 力导向布局由react-force-graph处理，我们只需返回原始数据
    return { nodes, links }
  }

  static applyTreeLayout(nodes: NodeData[], links: LinkData[]): LayoutResult {
    // 简化的树形布局算法
    // 找到根节点（没有入边的节点）
    const nodeMap = new Map(nodes.map(node => [String(node.id), { ...node }]))
    const incomingCount = new Map<string, number>()

    // 初始化入度计数
    nodes.forEach(node => {
      incomingCount.set(String(node.id), 0)
    })

    // 计算每个节点的入度
    links.forEach(link => {
      const targetId =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData).id)
      const current = incomingCount.get(targetId) || 0
      incomingCount.set(targetId, current + 1)
    })

    // 找到根节点（入度为0的节点）
    const rootNodes = Array.from(incomingCount.entries())
      .filter(([_, count]) => count === 0)
      .map(([id, _]) => id)

    // 如果没有明确的根节点，使用第一个节点作为根
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(String(nodes[0].id))
    }

    // 重置所有节点位置
    nodes.forEach(node => {
      node.x = 0
      node.y = 0
    })

    // 为简化实现，这里只是设置节点的层级位置
    // 实际的树形布局将在渲染时通过坐标调整体现
    const updatedNodes = [...nodes]
    const processed = new Set<string>()

    // 递归分配层级
    const assignLevels = (nodeId: string, level: number, x: number, y: number) => {
      if (processed.has(nodeId)) return
      processed.add(nodeId)

      const node = nodeMap.get(nodeId)
      if (node) {
        node.x = x
        node.y = y

        // 找到从此节点出发的链接
        const outgoingLinks = links.filter(link => {
          const sourceId =
            typeof link.source === 'string' || typeof link.source === 'number'
              ? String(link.source)
              : String((link.source as NodeData).id)
          return sourceId === nodeId
        })

        // 为子节点分配位置
        outgoingLinks.forEach((link, idx) => {
          const targetId =
            typeof link.target === 'string' || typeof link.target === 'number'
              ? String(link.target)
              : String((link.target as NodeData).id)

          const childX = x + 150
          const childY = y + (idx - (outgoingLinks.length - 1) / 2) * 100

          assignLevels(targetId, level + 1, childX, childY)
        })
      }
    }

    // 从根节点开始分配位置
    rootNodes.forEach((rootId, idx) => {
      assignLevels(rootId, 0, 0, idx * 200)
    })

    // 将计算后的坐标应用到节点上
    const finalNodes = updatedNodes.map(node => {
      const updatedNode = nodeMap.get(String(node.id))
      if (updatedNode) {
        const originalNode = nodes.find(n => String(n.id) === String(node.id))
        if (originalNode) {
          originalNode.x = updatedNode.x
          originalNode.y = updatedNode.y
        }
        return originalNode || node
      }
      return node
    })

    return { nodes: finalNodes, links }
  }

  static applyCircularLayout(nodes: NodeData[], links: LinkData[]): LayoutResult {
    const updatedNodes = [...nodes]
    const centerX = 0
    const centerY = 0
    const radius = Math.min(300, 20 * Math.sqrt(nodes.length))

    // 计算每个节点的角度
    updatedNodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })

    return { nodes: updatedNodes, links }
  }

  static applyGridLayout(nodes: NodeData[], links: LinkData[]): LayoutResult {
    const updatedNodes = [...nodes]
    const cols = Math.ceil(Math.sqrt(nodes.length))

    updatedNodes.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      node.x = col * 100 - cols * 50 // 居中
      node.y = row * 100 - Math.ceil(nodes.length / cols) * 50 // 居中
    })

    return { nodes: updatedNodes, links }
  }

  static applyLayout(nodes: NodeData[], links: LinkData[], layoutType: string): LayoutResult {
    switch (layoutType) {
      case 'tree':
        return this.applyTreeLayout(nodes, links)
      case 'circle':
        return this.applyCircularLayout(nodes, links)
      case 'grid':
        return this.applyGridLayout(nodes, links)
      case 'force':
      default:
        return this.applyForceLayout(nodes, links)
    }
  }
}
