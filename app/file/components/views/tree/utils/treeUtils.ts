import type { FolderNode } from '../../../types'

/**
 * 查找节点路径（从根到目标节点的所有节点ID）
 */
export const findNodePath = (
  nodes: FolderNode[],
  targetId: number,
  path: number[] = []
): number[] | null => {
  for (const node of nodes) {
    if (node.id === targetId) return [...path, node.id]
    if (node.children?.length) {
      const foundPath = findNodePath(node.children, targetId, [...path, node.id])
      if (foundPath) return foundPath
    }
  }
  return null
}

/**
 * 查找节点名称
 */
export const findNodeName = (nodes: FolderNode[], targetId: number): string | null => {
  for (const node of nodes) {
    if (node.id === targetId) return node.name
    if (node.children?.length) {
      const foundName = findNodeName(node.children, targetId)
      if (foundName) return foundName
    }
  }
  return null
}
