import type { WikiNode } from '@/lib/api/wiki'
import type { JSONContent } from 'novel'

export type NodeData = {
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

export type LinkData = {
  id?: number
  source: string | number | NodeData
  target: string | number | NodeData
  type?: string
}

export type ThemeColors = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  mutedForeground: string
  border: string
  primary: string
  ring: string
  accent: string
}

export type ArticlePayload = {
  html?: string
  content_markdown?: string
  content?: string | { type: string; content?: unknown[] }
}

export type GraphPalette = {
  background: string
  nodeDefault: string
  nodeActive: string
  nodeNeighbor: string
  nodeHover: string
  labelDefault: string
  labelActive: string
  labelNeighbor: string
  linkMuted: string
  linkActive: string
  border: string
  card: string
}

export type ForceGraphInstance = {
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
  emitParticle?: (...args: unknown[]) => unknown
  d3Force?: (...args: unknown[]) => unknown
  getGraphBbox?: () => { x: number; y: number; width: number; height: number } | null
  graph2ScreenCoords?: (x: number, y: number) => { x: number; y: number } | null
}

export { type WikiNode, type JSONContent }
