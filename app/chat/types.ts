export interface ChatRoom {
  id: number
  name: string
  description?: string
  created_by: number
  is_active: boolean
  created_at: string
  updated_at: string
  online_count?: number
  avatar?: string
  message_count?: number
  last_activity?: string
  unread_count?: number
}

export interface ChatMessage {
  id: number
  room_id: number
  user_id: number
  message: string
  message_type: 'text' | 'system'
  created_at: string
  updated_at: string
  user: {
    id: number
    name: string
    email: string
  }
  reactions?: Array<{
    emoji: string
    label: string
    count: number
    userReacted: boolean
  }>
}

export interface OnlineUser {
  id: number
  name: string
  email: string
  joined_at: string
  is_online: boolean
}

export interface ChatUser {
  id: number
  name: string
  email: string
  avatar?: string
  is_online?: boolean
}

export interface CreateRoomData {
  name: string
  description?: string
}

export interface MessagePagination {
  data: ChatMessage[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  has_more: boolean
  has_more_pages?: boolean
  next_cursor?: string
}

export interface ChatRoomState {
  currentRoom: ChatRoom | null
  rooms: ChatRoom[]
  messages: Record<string, ChatMessage[]>
  onlineUsers: Record<string, OnlineUser[]>
  messagesPagination: Record<string, MessagePagination>
  isLoading: boolean
  error: string | null
}

// Type alias for backward compatibility
export type Message = ChatMessage

// WebSocket 消息处理相关类型
export interface MessageData {
  type: string
  message?: ChatMessage
  user_id?: number
  room_id?: number
  user_name?: string
  online_count?: number
  action?: string
  timestamp?: string
  muted_until?: string
  reason?: string
  [key: string]: unknown
}

export interface MuteData extends MessageData {
  user_id: number
  room_id: number
  muted_until?: string
  reason?: string
}

export interface RoomUserEventData extends MessageData {
  room_id: number
  user_id: number
  user_name: string
  online_count: number
  action: string
  timestamp: string
}

export interface PresenceUser {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface PresenceData {
  action: string
  users: PresenceUser[]
  user?: PresenceUser
}

// 重新导出 ChatRoomState 作为 ChatState（向后兼容）
export type ChatState = ChatRoomState
