/** GET /api/system/status 响应 */
export interface SystemStatusApiResponse {
  openclaw: {
    online: boolean
    status: string
    details: string
    cpu_percent?: number | null
    memory_percent?: number | null
    disk_percent?: number | null
  }
  reverb: {
    status: string
    raw_state: string
    details: string
  }
  queue: {
    status: string
    raw_state: string
    details: string
  }
  database: {
    status: string
    details: string
    response_time?: number
  }
  redis: {
    status: string
    details: string
    response_time?: number
  }
  cdn: {
    status: string
    details: string
    response_time?: number
  }
  scheduler: {
    status: string
    details: string
    last_run?: string
  }
  github?: {
    status: string
    details: string
    core_remaining?: number | null
    core_limit?: number | null
    core_used?: number | null
    graphql_remaining?: number | null
    graphql_limit?: number | null
    graphql_used?: number | null
    reset_at?: string | null
  }
}
