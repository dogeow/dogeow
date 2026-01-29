import { useState, useCallback, useRef } from 'react'
import { getWikiGraph } from '@/lib/api/wiki'
import { toast } from 'sonner'
import { LayoutManager } from '../utils/layoutManager'
import type { NodeData, LinkData, ForceGraphInstance } from '../types'

export function useGraphData() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [links, setLinks] = useState<LinkData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentLayout, setCurrentLayout] = useState<string>('force')
  const fgRef = useRef<ForceGraphInstance | null>(null)

  const resumeGraphAnimation = useCallback(() => {
    const graph = fgRef.current
    if (!graph) return

    try {
      // 只在必要时恢复动画，避免频繁重启
      if (typeof graph.d3ReheatSimulation === 'function') {
        graph.d3ReheatSimulation()
      }
      if (typeof graph.resumeAnimation === 'function') {
        graph.resumeAnimation()
      }
    } catch (error) {
      console.warn('恢复图谱动画失败:', error)
    }
  }, [])

  // 切换布局
  const changeLayout = useCallback(
    (layoutType: string) => {
      setCurrentLayout(layoutType)
      if (nodes.length > 0) {
        // 应用新的布局
        const { nodes: layoutNodes, links: layoutLinks } = LayoutManager.applyLayout(
          nodes,
          links,
          layoutType
        )

        setNodes(layoutNodes)
        setLinks(layoutLinks)

        // 恢复动画以适应新布局
        resumeGraphAnimation()
      }
    },
    [nodes, links, resumeGraphAnimation]
  )

  // 加载图谱数据
  const loadGraphData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getWikiGraph()

      // 转换节点数据
      let normalizedNodes: NodeData[] = data.nodes.map(node => ({
        id: node.id,
        title: node.title,
        slug: node.slug,
        tags: node.tags || [],
        summary: node.summary || '',
      }))

      // 转换链接数据
      const normalizedLinks: LinkData[] = data.links.map(link => ({
        id: link.id,
        source: link.source,
        target: link.target,
        type: link.type,
      }))

      // 应用当前布局
      if (currentLayout !== 'force') {
        const layoutResult = LayoutManager.applyLayout(
          normalizedNodes,
          normalizedLinks,
          currentLayout
        )
        normalizedNodes = layoutResult.nodes
      }

      setNodes(normalizedNodes)
      setLinks(normalizedLinks)

      // 数据加载后让布局自然稳定，不需要立即恢复动画
      requestAnimationFrame(() => {
        // 延迟一点再恢复，确保图表已经更新数据
        setTimeout(() => {
          resumeGraphAnimation()
        }, 100)
      })
    } catch (error) {
      console.error('加载图谱数据失败:', error)
      toast.error('加载图谱数据失败')
    } finally {
      setLoading(false)
    }
  }, [resumeGraphAnimation, currentLayout])

  return {
    nodes,
    setNodes,
    links,
    setLinks,
    loading,
    currentLayout,
    fgRef,
    loadGraphData,
    resumeGraphAnimation,
    changeLayout,
  }
}
