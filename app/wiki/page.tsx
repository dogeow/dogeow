'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import * as Dialog from '@radix-ui/react-dialog'
import { getWikiGraph, getArticle, deleteNode, type WikiNode } from '@/lib/api/wiki'
import { isAdminSync } from '@/lib/auth'
import NodeEditor from './components/NodeEditor'
import LinkCreator from './components/LinkCreator'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react'
import type { JSONContent } from 'novel'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
})

const ReadonlyEditor = dynamic(() => import('@/components/novel-editor/readonly'), {
  ssr: false,
})

type NodeData = {
  id: string | number
  title: string
  slug: string
  tags?: string[]
  summary?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

type LinkData = {
  id?: number
  source: string | number | NodeData
  target: string | number | NodeData
  type?: string
}

const nodeDataToWikiNode = (node: NodeData): WikiNode => ({
  id: Number(node.id),
  title: node.title,
  slug: node.slug || '',
  tags: node.tags,
  summary: node.summary,
})

type ForceGraphInstance = {
  graphData: (data: { nodes: NodeData[]; links: LinkData[] }) => void
  zoom: (k?: number, transitionMs?: number) => ForceGraphInstance
  zoomToFit: (...args: unknown[]) => ForceGraphInstance
  centerAt: (x?: number, y?: number, transitionMs?: number) => ForceGraphInstance
  pauseAnimation: () => void
  resumeAnimation: () => void
  d3ReheatSimulation: () => void
  d3Zoom: () => {
    filter: (filter?: (event: Event) => boolean) => {
      filter: (filter?: (event: Event) => boolean) => unknown
    }
  } | null
  width?: () => number
  height?: () => number
  clientWidth?: number
  clientHeight?: number
  screen2GraphCoords: (x: number, y: number) => { x: number; y: number } | null
}

export default function WikiGraphPage() {
  const fgRef = useRef<ForceGraphInstance | null>(null)
  const lastZoomRef = useRef<number>(1)
  const lastTransformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 })
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null)
  const allowInternalZoomRef = useRef<boolean>(false)
  const isDraggingRef = useRef<boolean>(false)
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null)
  const [activeNode, setActiveNode] = useState<NodeData | null>(null)
  const [query, setQuery] = useState<string>('')
  const [articleHtml, setArticleHtml] = useState<string>('')
  const [articleRaw, setArticleRaw] = useState<string>('')
  const [articleJson, setArticleJson] = useState<JSONContent | null>(null)
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false)
  const [articleError, setArticleError] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [showNeighborsOnly, setShowNeighborsOnly] = useState<boolean>(false)

  // 编辑相关状态
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [links, setLinks] = useState<LinkData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editorOpen, setEditorOpen] = useState<boolean>(false)
  const [editingNode, setEditingNode] = useState<WikiNode | null>(null)
  const [templateNode, setTemplateNode] = useState<WikiNode | null>(null)
  const [linkCreatorOpen, setLinkCreatorOpen] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const restoreView = useCallback(
    (options: { zoom?: boolean; center?: boolean } = { zoom: true, center: true }) => {
      if (!fgRef.current) return
      allowInternalZoomRef.current = true
      const { zoom = true, center = true } = options

      if (zoom) {
        fgRef.current.zoom(lastZoomRef.current)
      }

      if (center && lastCenterRef.current) {
        const { x, y } = lastCenterRef.current
        fgRef.current.centerAt(x, y, 0)
      }

      allowInternalZoomRef.current = false
    },
    []
  )

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

  type ArticlePayload = {
    html?: string
    content_markdown?: string
    content?: string | { type: string; content?: unknown[] }
  }

  const handleArticlePayload = useCallback((article: ArticlePayload | null) => {
    if (!article) {
      setArticleError('未获取到文章内容')
      setArticleHtml('')
      setArticleRaw('')
      setArticleJson(null)
      return
    }

    const html = (article.html ?? '').trim()
    setArticleHtml(html)

    let markdownOrRaw = article.content_markdown ?? ''
    let parsedJson: JSONContent | null = null

    const rawContent = article.content
    if (!html && rawContent) {
      if (typeof rawContent === 'string') {
        try {
          parsedJson = JSON.parse(rawContent) as JSONContent
        } catch {
          if (!markdownOrRaw) {
            markdownOrRaw = rawContent
          }
        }
      } else if (typeof rawContent === 'object') {
        parsedJson = rawContent as JSONContent
      }
    }

    setArticleJson(parsedJson)
    setArticleRaw(markdownOrRaw || '')

    if (!html && !parsedJson && !markdownOrRaw) {
      setArticleError('文章暂无内容')
    } else {
      setArticleError('')
    }
  }, [])
  // 禁用点击/双击触发的默认 zoom（仅保留滚轮缩放）
  useEffect(() => {
    const graph = fgRef.current
    if (!graph) return

    let attempts = 0
    const MAX_ATTEMPTS = 20
    let cleanup: (() => void) | null = null

    const applyZoomFilter = () => {
      const graph = fgRef.current
      const zoom = graph?.d3Zoom?.()

      if (!zoom || typeof zoom.filter !== 'function') {
        return false
      }

      const originalFilter = zoom.filter()
      let originalFilterFn: ((event: Event) => boolean) | null = null
      if (originalFilter && typeof originalFilter === 'function') {
        originalFilterFn = originalFilter as (event: Event) => boolean
      }
      const safeFilter = (event: Event | null) => {
        const eventType = event?.type

        // 程序化缩放（无事件对象）直接通过
        if (!eventType) {
          return true
        }

        // 禁止 click / dblclick 触发 D3 的 scaleBy，保留滚轮/触摸缩放
        if (eventType === 'click' || eventType === 'dblclick') {
          return false
        }

        if (!originalFilterFn) {
          return true
        }

        try {
          return originalFilterFn(event)
        } catch (error) {
          console.warn('D3 zoom filter 执行失败，已回退默认允许:', error)
          return true
        }
      }

      zoom.filter(safeFilter)
      cleanup = () => {
        if (originalFilterFn) {
          zoom.filter(originalFilterFn)
        } else {
          zoom.filter(undefined)
        }
      }
      return true
    }

    const intervalId = window.setInterval(() => {
      attempts += 1
      if (applyZoomFilter() || attempts >= MAX_ATTEMPTS) {
        window.clearInterval(intervalId)
      }
    }, 300)

    return () => {
      window.clearInterval(intervalId)
      if (cleanup) cleanup()
    }
  }, [])

  // 加载图谱数据
  const loadGraphData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getWikiGraph()

      // 转换节点数据
      const normalizedNodes: NodeData[] = data.nodes.map(node => ({
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
  }, [resumeGraphAnimation])

  // 初始化加载数据
  useEffect(() => {
    loadGraphData()
    setIsAdmin(isAdminSync())
  }, [loadGraphData])

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

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px 40px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          加载中...
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              if (e.target.value.trim()) {
                setShowNeighborsOnly(false)
              }
              // 搜索只是过滤数据，不需要恢复动画
            }}
            placeholder="搜索节点（标题/标签/摘要）"
            style={{
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              minWidth: 260,
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setShowNeighborsOnly(false)
              }}
              style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}
            >
              清空
            </button>
          )}
          {/* 管理员按钮 - 始终显示 */}
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingNode(null)
                  const base = activeNode ? nodeDataToWikiNode(activeNode) : null
                  setTemplateNode(base)
                  setEditorOpen(true)
                }}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#10b981',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                新建节点
              </button>
              <button
                onClick={() => {
                  setLinkCreatorOpen(true)
                }}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#8b5cf6',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <LinkIcon style={{ width: 16, height: 16 }} />
                创建链接
              </button>
            </>
          )}
          {activeNode && (
            <>
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
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
                    }}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: '#f59e0b',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Edit style={{ width: 16, height: 16 }} />
                    编辑节点
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          `确定要删除节点"${activeNode.title}"吗？这将同时删除所有相关链接。`
                        )
                      ) {
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
                    }}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: '#ef4444',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                    删除节点
                  </button>
                </>
              )}
              {activeNode.slug && (
                <button
                  onClick={async () => {
                    setDialogOpen(true)
                    setArticleError('')
                    setArticleHtml('')
                    setArticleRaw('')
                    setArticleJson(null)
                    setLoadingArticle(true)
                    try {
                      const article = await getArticle(activeNode.slug)
                      handleArticlePayload(article)
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : String(error)
                      setArticleError(errorMessage || '加载失败')
                    } finally {
                      setLoadingArticle(false)
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  查看文章
                </button>
              )}
              <button
                onClick={() => {
                  setActiveNode(null)
                  setShowNeighborsOnly(false)
                }}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#ffffff',
                  color: '#111827',
                  cursor: 'pointer',
                }}
              >
                取消选中
              </button>
            </>
          )}
        </div>

        {!loading && nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 8 }}>图谱为空</div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              {isAdmin ? '点击上方的「新建节点」按钮开始创建知识节点' : '暂无数据'}
            </div>
          </div>
        )}
        <ForceGraph2D
          ref={fgRef as React.RefObject<ForceGraphInstance>}
          graphData={filtered}
          nodeId="id"
          nodeLabel={n => (n as NodeData).title}
          linkDirectionalArrowLength={4}
          linkColor={(l: unknown) => {
            const link = l as LinkData
            const mutedColor = 'rgba(203, 213, 225, 0.3)' // slate-200
            if (!activeNode) return mutedColor
            const s =
              typeof link.source === 'string' || typeof link.source === 'number'
                ? String(link.source)
                : String((link.source as NodeData)?.id)
            const t =
              typeof link.target === 'string' || typeof link.target === 'number'
                ? String(link.target)
                : String((link.target as NodeData)?.id)
            if (s === String(activeNode.id) || t === String(activeNode.id)) {
              return 'rgba(37, 99, 235, 0.95)' // vivid blue for active connections
            }
            return mutedColor
          }}
          linkWidth={(l: unknown) => {
            const link = l as LinkData
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
          }}
          backgroundColor="#ffffff"
          onNodeHover={n => setHoverNode((n as NodeData) ?? null)}
          onNodeClick={n => {
            // 单击：选中节点，如果重复点击已选中的节点则取消选中
            const nd = n as NodeData
            if (String(activeNode?.id) === String(nd.id)) {
              // 重复点击已选中的节点，取消选中
              setActiveNode(null)
              setShowNeighborsOnly(false)
            } else {
              // 选中新节点（不恢复动画，避免布局偏移）
              setActiveNode(nd)
            }
            // 保持当前缩放级别，防止点击触发默认缩放
            requestAnimationFrame(() => restoreView())
          }}
          onNodeDrag={() => {
            isDraggingRef.current = true
            // 拖动时恢复动画以便节点可以移动
            resumeGraphAnimation()
          }}
          onNodeDragEnd={() => {
            isDraggingRef.current = false
            // 拖动结束后不需要立即恢复动画，让布局自然稳定
          }}
          onNodeRightClick={n => {
            // 右键：管理员显示编辑菜单，否则打开文章
            const nd = n as NodeData
            setActiveNode(nd)

            if (isAdmin) {
              // 管理员：显示编辑菜单（可以通过上下文菜单实现，这里简化处理）
              const node = nodes.find(node => String(node.id) === String(nd.id))
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
            } else if (nd.slug) {
              // 非管理员：打开文章
              setDialogOpen(true)
              setArticleError('')
              setArticleHtml('')
              setArticleRaw('')
              setArticleJson(null)
              setLoadingArticle(true)
              getArticle(nd.slug)
                .then(article => {
                  handleArticlePayload(article)
                })
                .catch(error => {
                  const errorMessage = error instanceof Error ? error.message : String(error)
                  setArticleError(errorMessage || '加载失败')
                })
                .finally(() => setLoadingArticle(false))
            }
          }}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as NodeData
            const label = n.title
            const fontSize = 12 / Math.sqrt(globalScale)
            const isActive = String(activeNode?.id) === String(n.id)
            const isHover = String(hoverNode?.id) === String(n.id)

            // 使用缓存的邻居集合，避免重复遍历
            const isNeighbor = activeNode && !isActive && neighborIds.has(String(n.id))

            const radius = 4
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, 2 * Math.PI, false)

            if (isActive) {
              ctx.fillStyle = '#2563eb'
            } else if (isNeighbor) {
              ctx.fillStyle = '#60a5fa'
            } else if (isHover) {
              ctx.fillStyle = '#0ea5e9'
            } else {
              ctx.fillStyle = '#111827'
            }
            ctx.fill()

            ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto`
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            if (isActive) {
              ctx.fillStyle = '#1e40af'
            } else if (isNeighbor) {
              ctx.fillStyle = '#3b82f6'
            } else {
              ctx.fillStyle = '#334155'
            }
            ctx.fillText(label, (n.x ?? 0) + 6, n.y ?? 0)
          }}
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
          onZoom={transform => {
            lastZoomRef.current = transform.k
            lastTransformRef.current = { x: transform.x, y: transform.y, k: transform.k }

            if (fgRef.current?.screen2GraphCoords) {
              const width =
                fgRef.current.width?.() ?? fgRef.current.clientWidth ?? window.innerWidth
              const height =
                fgRef.current.height?.() ?? fgRef.current.clientHeight ?? window.innerHeight
              const center = fgRef.current.screen2GraphCoords(width / 2, height / 2)
              if (center) {
                lastCenterRef.current = center
              }
            }
          }}
          onEngineStop={() => {
            if (!fgRef.current) return
            // 布局稳定后立即暂停，避免持续消耗性能导致卡顿
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

      <Dialog.Root
        open={dialogOpen}
        onOpenChange={o => {
          setDialogOpen(o)
          // 关闭弹窗时不重置选中节点和邻居视图，保持用户的选择
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 50,
            }}
          />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(880px, 92vw)',
              maxHeight: '85vh',
              background: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              zIndex: 51,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid #e5e7eb',
                gap: 8,
              }}
            >
              <Dialog.Title style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>
                {activeNode?.title ?? '文章'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
                >
                  关闭
                </button>
              </Dialog.Close>
            </div>
            <div
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                overflowY: 'auto',
              }}
            >
              {activeNode?.tags?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeNode.tags.map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: 12,
                        padding: '2px 6px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 999,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}
              {activeNode?.summary ? (
                <p style={{ color: '#475569' }}>{activeNode.summary}</p>
              ) : null}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                {loadingArticle ? (
                  <div style={{ color: '#64748b' }}>加载中...</div>
                ) : articleError ? (
                  <div style={{ color: '#dc2626' }}>加载失败：{articleError}</div>
                ) : articleHtml ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: articleHtml }}
                  />
                ) : articleJson ? (
                  <ReadonlyEditor content={articleJson} />
                ) : articleRaw ? (
                  <pre
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#334155' }}
                  >
                    {articleRaw}
                  </pre>
                ) : (
                  <div style={{ color: '#64748b' }}>点击节点以加载文章</div>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => {
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
            }}
            style={{
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#f59e0b',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit style={{ width: 16, height: 16 }} />
            编辑节点
          </button>
          <button
            onClick={async () => {
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
            }}
            style={{
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#ef4444',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Trash2 style={{ width: 16, height: 16 }} />
            删除节点
          </button>
        </div>
      )}
    </div>
  )
}
