'use client'

import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { deleteNode, type WikiNode } from '@/lib/api/wiki'
import { isAdminSync } from '@/lib/auth'
import NodeEditor from './components/NodeEditor'
import LinkCreator from './components/LinkCreator'
import { toast } from 'sonner'
import { nodeDataToWikiNode } from './utils/themeUtils'
import {
  createNodeCanvasRenderer,
  createLinkColorGetter,
  createLinkWidthGetter,
} from './utils/nodeRenderer'
import { useGraphData } from './hooks/useGraphData'
import { useArticleLoader } from './hooks/useArticleLoader'
import { useThemeColors } from './hooks/useThemeColors'
import { useGraphFilter } from './hooks/useGraphFilter'
import { useGraphPalette } from './hooks/useGraphPalette'
import { useGraphZoom } from './hooks/useGraphZoom'
import { useZoomFilter } from './hooks/useZoomFilter'
import { GraphToolbar } from './components/GraphToolbar'
import { ArticleDialog } from './components/ArticleDialog'
import { GraphEmptyState } from './components/GraphEmptyState'
import { GraphLoadingState } from './components/GraphLoadingState'
import { BottomActionBar } from './components/BottomActionBar'
import { LayoutSelector } from './components/LayoutSelector'
import { NodeDetailsPanel } from './components/NodeDetailsPanel'
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization'
import type { NodeData, ForceGraphInstance } from './types'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
})

export default function WikiGraphPage() {
  const isDraggingRef = useRef<boolean>(false)
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null)
  const [activeNode, setActiveNode] = useState<NodeData | null>(null)
  const [query, setQuery] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editorOpen, setEditorOpen] = useState<boolean>(false)
  const [editingNode, setEditingNode] = useState<WikiNode | null>(null)
  const [templateNode, setTemplateNode] = useState<WikiNode | null>(null)
  const [linkCreatorOpen, setLinkCreatorOpen] = useState<boolean>(false)
  const [isAdmin] = useState<boolean>(() => isAdminSync())
  const [selectedLayout, setSelectedLayout] = useState<string>('force')

  // 使用自定义 hooks
  const {
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
  } = useGraphData()
  const { optimizeGraphData, showPerformanceWarning } = usePerformanceOptimization()
  const {
    articleHtml,
    articleRaw,
    articleJson,
    loadingArticle,
    articleError,
    loadArticle,
    resetArticle,
  } = useArticleLoader()
  const { isDark, themeColors } = useThemeColors()
  // 简化的过滤逻辑，移除showNeighborsOnly依赖
  const { filtered: unoptimizedFiltered, neighborIds } = useMemo(() => {
    // 缓存邻居节点集合，避免在 nodeCanvasObject 中重复计算
    const neighborIds = (() => {
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
    })()

    let filteredNodes = nodes
    let filteredLinks = links

    // 搜索过滤：显示匹配节点及其直接邻居，使连接完整可见
    if (query.trim()) {
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
      filteredNodes = nodes.filter(n => neighborIds.has(String(n.id)))
      const fSet = new Set(filteredNodes.map(n => String(n.id)))

      // 过滤链接：只显示连接这些节点的完整链接
      filteredLinks = links.filter(l => {
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
    }

    return { filtered: { nodes: filteredNodes, links: filteredLinks }, neighborIds }
  }, [nodes, links, query, activeNode])

  const filtered = useMemo(() => {
    return optimizeGraphData(unoptimizedFiltered.nodes, unoptimizedFiltered.links)
  }, [unoptimizedFiltered, optimizeGraphData])
  const graphPalette = useGraphPalette(isDark, themeColors)
  const { restoreView, handleZoom } = useGraphZoom()

  // 使用缩放过滤器
  useZoomFilter(fgRef)

  // 初始化加载数据
  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  // 处理节点点击
  const handleNodeClick = useCallback(
    (node: { [others: string]: any; id?: string | number }, event?: MouseEvent) => {
      const n = node as NodeData
      if (String(activeNode?.id) === String(n.id)) {
        // 重复点击已选中的节点，取消选中
        setActiveNode(null)
      } else {
        // 选中新节点（不恢复动画，避免布局偏移）
        setActiveNode(n)
      }
      // 保持当前缩放级别，防止点击触发默认缩放
      requestAnimationFrame(() => restoreView(fgRef))
    },
    [activeNode, restoreView, fgRef]
  )

  // 处理节点拖拽
  const handleNodeDrag = useCallback(
    (
      _node: { [others: string]: any; id?: string | number },
      _translate?: { x: number; y: number }
    ) => {
      isDraggingRef.current = true
      // 拖动时恢复动画以便节点可以移动
      resumeGraphAnimation()
    },
    [resumeGraphAnimation]
  )

  const handleNodeDragEnd = useCallback(
    (
      _node: { [others: string]: any; id?: string | number },
      _translate?: { x: number; y: number }
    ) => {
      isDraggingRef.current = false
    },
    []
  )

  // 处理节点右键点击
  const handleNodeRightClick = useCallback(
    (node: { [others: string]: any; id?: string | number }, event?: MouseEvent) => {
      const n = node as NodeData
      setActiveNode(n)

      if (isAdmin) {
        // 管理员：显示编辑菜单
        const node = nodes.find(node => String(node.id) === String(n.id))
        if (node) {
          setEditingNode({
            id: Number(node.id),
            title: node.title,
            slug: node.slug,
            tags: node.tags,
            summary: node.summary,
          } as WikiNode)
          setEditorOpen(true)
        }
      } else if (n.slug) {
        // 非管理员：打开文章
        setDialogOpen(true)
        resetArticle()
        loadArticle(n.slug)
      }
    },
    [isAdmin, nodes, loadArticle, resetArticle]
  )

  // 处理查询变化
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  // 处理新建节点
  const handleNewNode = useCallback(() => {
    setEditingNode(null)
    const base = activeNode ? nodeDataToWikiNode(activeNode) : null
    setTemplateNode(base)
    setEditorOpen(true)
  }, [activeNode])

  // 处理编辑节点
  const handleEditNode = useCallback(() => {
    if (!activeNode) return
    const node = nodes.find(n => String(n.id) === String(activeNode.id))
    if (node) {
      setTemplateNode(null)
      setEditingNode({
        id: Number(node.id),
        title: node.title,
        slug: node.slug,
        tags: node.tags,
        summary: node.summary,
      } as WikiNode)
      setEditorOpen(true)
    }
  }, [activeNode, nodes])

  // 处理删除节点
  const handleDeleteNode = useCallback(async () => {
    if (!activeNode) return
    if (!confirm(`确定要删除节点"${activeNode.title}"吗？这将同时删除所有相关链接。`)) {
      return
    }
    try {
      await deleteNode(Number(activeNode.id))
      toast.success('节点已删除')
      setActiveNode(null)
      loadGraphData()
    } catch (error) {
      console.error('删除节点失败:', error)
      toast.error('删除失败')
    }
  }, [activeNode, loadGraphData])

  // 处理查看文章
  const handleViewArticle = useCallback(async () => {
    if (!activeNode?.slug) return
    setDialogOpen(true)
    resetArticle()
    loadArticle(activeNode.slug)
  }, [activeNode, loadArticle, resetArticle])

  // 处理取消选中
  const handleClearSelection = useCallback(() => {
    setActiveNode(null)
  }, [])

  // 节点渲染函数
  const nodeCanvasObject = useCallback(
    (
      obj: { [others: string]: any; id?: string | number },
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const node = obj as NodeData
      createNodeCanvasRenderer(
        activeNode,
        hoverNode,
        neighborIds,
        graphPalette
      )(node, ctx, globalScale)
    },
    [activeNode, hoverNode, neighborIds, graphPalette]
  )

  // 链接颜色获取函数
  const linkColor = useCallback(
    (link: unknown) => {
      return createLinkColorGetter(activeNode, graphPalette)(link as any)
    },
    [activeNode, graphPalette]
  )

  // 链接宽度获取函数
  const linkWidth = useCallback(
    (link: unknown) => {
      return createLinkWidthGetter(activeNode)(link as any)
    },
    [activeNode]
  )

  // 处理布局变化
  const handleLayoutChange = useCallback(
    (layout: string) => {
      setSelectedLayout(layout)
      changeLayout(layout)
      toast.info(
        `切换到${layout === 'force' ? '力导向' : layout === 'tree' ? '树状' : layout === 'circle' ? '圆形' : '网格'}布局`
      )
    },
    [changeLayout]
  )

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background: themeColors.background,
        color: themeColors.foreground,
      }}
    >
      {loading && <GraphLoadingState themeColors={themeColors} isDark={isDark} />}
      <div style={{ position: 'relative' }}>
        <GraphToolbar
          query={query}
          onQueryChange={handleQueryChange}
          isAdmin={isAdmin}
          activeNode={activeNode}
          nodes={nodes}
          themeColors={themeColors}
          onNewNode={handleNewNode}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNode}
          onCreateLink={() => setLinkCreatorOpen(true)}
          onViewArticle={handleViewArticle}
          onClearSelection={handleClearSelection}
        />

        {/* 布局选择器 */}
        <LayoutSelector
          currentLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
          themeColors={themeColors}
        />

        {!loading && nodes.length === 0 && (
          <GraphEmptyState isAdmin={isAdmin} themeColors={themeColors} />
        )}

        <ForceGraph2D
          ref={fgRef as React.RefObject<any>}
          graphData={filtered}
          nodeId="id"
          nodeLabel={n => (n as NodeData).title}
          linkDirectionalArrowLength={4}
          linkColor={linkColor}
          linkWidth={linkWidth}
          backgroundColor={graphPalette.background}
          onNodeHover={n => setHoverNode((n as NodeData) ?? null)}
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeRightClick={handleNodeRightClick}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as NodeData
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, 5, 0, 2 * Math.PI, false)
            ctx.fill()
          }}
          cooldownTime={3000}
          d3AlphaDecay={0.0228}
          d3VelocityDecay={0.4}
          d3AlphaMin={0.001}
          onZoom={transform => handleZoom(fgRef, transform)}
          onEngineStop={() => {
            if (!fgRef.current) return
            try {
              if (typeof fgRef.current.pauseAnimation === 'function') {
                fgRef.current.pauseAnimation()
              }
            } catch {
              // 忽略暂停失败的错误
            }
          }}
        />
      </div>

      <ArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activeNode={activeNode}
        articleHtml={articleHtml}
        articleRaw={articleRaw}
        articleJson={articleJson}
        loadingArticle={loadingArticle}
        articleError={articleError}
        isDark={isDark}
        themeColors={themeColors}
      />

      {/* 节点详情面板 */}
      <NodeDetailsPanel
        node={activeNode}
        isOpen={!!activeNode}
        onClose={() => setActiveNode(null)}
        themeColors={themeColors}
        onViewArticle={handleViewArticle}
      />

      {/* 节点编辑器 */}
      <NodeEditor
        node={editingNode}
        templateNode={editingNode ? null : templateNode}
        open={editorOpen}
        onOpenChange={open => {
          setEditorOpen(open)
          if (!open) {
            setEditingNode(null)
            setTemplateNode(null)
          }
        }}
        onSuccess={() => {
          loadGraphData()
        }}
      />

      {/* 链接创建器 */}
      <LinkCreator
        nodes={nodes.map(n => ({
          id: Number(n.id),
          title: n.title,
          slug: n.slug,
          tags: n.tags,
          summary: n.summary,
        }))}
        open={linkCreatorOpen}
        onOpenChange={setLinkCreatorOpen}
        onSuccess={() => {
          loadGraphData()
        }}
        sourceNodeId={activeNode ? Number(activeNode.id) : undefined}
      />

      {/* 管理员操作菜单（选中节点时显示） */}
      {isAdmin && activeNode && (
        <BottomActionBar
          isAdmin={isAdmin}
          themeColors={themeColors}
          onEdit={handleEditNode}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  )
}
