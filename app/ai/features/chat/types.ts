export const AI_SYSTEM_PROMPT = '你是一个有用的AI助理，请用中文回答问题，必要时给出步骤和示例。'

export interface ChatMessageImage {
  url: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: ChatMessageImage[]
}
