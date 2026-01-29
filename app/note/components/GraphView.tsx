'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { deleteNode, type WikiNode } from '@/lib/api/wiki'
import { isAdminSync } from '@/lib/auth'
import NoteNodeEditor from './NoteNodeEditor'
import NoteLinkCreator from './NoteLinkCreator'
import { toast } from 'sonner'
import { nodeDataToWikiNode } from '../utils/themeUtils'
import {
  createNodeCanvasRenderer,
  createLinkColorGetter,
  createLinkWidthGetter,
} from '../utils/nodeRenderer'
import { useGraphData } from '../hooks/useGraphData'
import { useArticleLoader } from '../hooks/useArticleLoader'
import { useThemeColors } from '../hooks/useThemeColors'
import { useGraphFilter } from '../hooks/useGraphFilter'
import { useGraphPalette } from '../hooks/useGraphPalette'
import { useGraphZoom } from '../hooks/useGraphZoom'
import { useZoomFilter } from '../hooks/useZoomFilter'
import { NoteGraphToolbar } from './NoteGraphToolbar'
import { NoteArticleDialog } from './NoteArticleDialog'
import { NoteGraphEmptyState } from './NoteGraphEmptyState'
import { NoteGraphLoadingState } from './NoteGraphLoadingState'
import NoteNodeActionPanel from './NoteNodeActionPanel'
import type { NodeData, ForceGraphInstance } from '../types/graph'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
})

interface GraphViewProps {
  query?: string
  onNewNodeRef?: React.MutableRefObject<(() => void) | null>
  onCreateLinkRef?: React.MutableRefObject<(() => void) | null>
}

export default function GraphView({ query = '', onNewNodeRef, onCreateLinkRef }: GraphViewProps) {
  const router = useRouter()
  const isDraggingRef = useRef<boolean>(false)
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null)
  const [activeNode, setActiveNode] = useState<NodeData | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [showNeighborsOnly, setShowNeighborsOnly] = useState<boolean>(false)
  const [editorOpen, setEditorOpen] = useState<boolean>(false)
  const [editingNode, setEditingNode] = useState<WikiNode | null>(null)
  const [templateNode, setTemplateNode] = useState<WikiNode | null>(null)
  const [linkCreatorOpen, setLinkCreatorOpen] = useState<boolean>(false)
  const [isAdmin] = useState<boolean>(() => isAdminSync())

  // 使用自定义 hooks
  const { nodes, setNodes, links, setLinks, loading, fgRef, loadGraphData, resumeGraphAnimation } =
    useGraphData()
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
  const { filtered, neighborIds } = useGraphFilter(
    nodes,
    links,
    query,
    showNeighborsOnly,
    activeNode
  )
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
        setShowNeighborsOnly(false)
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

  // 处理新建节点
  const handleNewNode = useCallback(() => {
    setEditingNode(null)
    const base = activeNode ? nodeDataToWikiNode(activeNode) : null
    setTemplateNode(base)
    setEditorOpen(true)
  }, [activeNode])

  // 处理创建子节点（以当前选中节点为模板）
  const handleCreateChildNode = useCallback(() => {
    if (!activeNode) return
    setEditingNode(null)
    const base = nodeDataToWikiNode(activeNode)
    setTemplateNode(base)
    setEditorOpen(true)
  }, [activeNode])

  // 处理创建链接
  const handleCreateLink = useCallback(() => {
    setLinkCreatorOpen(true)
  }, [])

  // 暴露方法给父组件
  useEffect(() => {
    if (onNewNodeRef) {
      onNewNodeRef.current = handleNewNode
    }
    if (onCreateLinkRef) {
      onCreateLinkRef.current = handleCreateLink
    }
    return () => {
      if (onNewNodeRef) {
        onNewNodeRef.current = null
      }
      if (onCreateLinkRef) {
        onCreateLinkRef.current = null
      }
    }
  }, [handleNewNode, handleCreateLink, onNewNodeRef, onCreateLinkRef])

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

  // 处理编辑文章
  const handleEditArticle = useCallback(() => {
    if (!activeNode?.id) return
    router.push(`/note/edit/${activeNode.id}`)
  }, [activeNode, router])

  // 处理取消选中
  const handleClearSelection = useCallback(() => {
    setActiveNode(null)
    setShowNeighborsOnly(false)
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

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 200px)',
        background: themeColors.background,
        color: themeColors.foreground,
      }}
    >
      {loading && <NoteGraphLoadingState themeColors={themeColors} isDark={isDark} />}
      <div style={{ position: 'relative' }}>
        <NoteGraphToolbar
          query={query}
          onQueryChange={() => {}}
          isAdmin={isAdmin}
          activeNode={activeNode}
          nodes={nodes}
          themeColors={themeColors}
          onNewNode={handleNewNode}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNode}
          onCreateLink={handleCreateLink}
          onViewArticle={handleViewArticle}
          onEditArticle={handleEditArticle}
          onClearSelection={handleClearSelection}
        />

        {!loading && nodes.length === 0 && (
          <NoteGraphEmptyState isAdmin={isAdmin} themeColors={themeColors} />
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
          cooldownTime={showNeighborsOnly ? 2000 : 3000}
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

      <NoteArticleDialog
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

      {/* 节点编辑器 */}
      <NoteNodeEditor
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
      <NoteLinkCreator
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

      {/* 节点操作面板 */}
      <NoteNodeActionPanel
        activeNode={activeNode}
        themeColors={themeColors}
        isAdmin={isAdmin}
        onCreateChildNode={handleCreateChildNode}
        onCreateLink={handleCreateLink}
        onNodeUpdated={loadGraphData}
        onClose={handleClearSelection}
      />
    </div>
  )
}
