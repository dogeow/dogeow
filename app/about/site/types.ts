export interface DevLogEntry {
  id: string
  date: Date
  version?: string
  type: 'feature' | 'bugfix' | 'update' | 'release' | 'milestone'
  title: string
  description: string
  author?: string
  tags?: string[]
}

export interface SystemStatus {
  name: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastCheck: Date
  icon: React.ReactNode
  description: string
  details?: string
}
