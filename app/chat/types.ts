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
