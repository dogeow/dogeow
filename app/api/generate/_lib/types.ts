export type GenerateOption = 'improve' | 'fix' | 'shorter' | 'longer' | 'continue' | 'zap'

export type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateRequestBody {
  option: GenerateOption
  command?: string
  text?: string
  messages?: ChatMessage[]
  useChat?: boolean
  model?: string
  provider?: AIProvider
  images?: string[]
  imageUrl?: string
}

export interface GitHubChunk {
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

export interface OllamaResponse {
  response?: string
  message?: {
    role: string
    content: string
  }
  done?: boolean
}

export interface MiniMaxChunk {
  type: string
  index?: number
  delta?: { type: string; text?: string }
  usage?: { input_tokens: number; output_tokens: number }
  message?: { role: string; content: string }
}

export interface ZhipuAIChunk {
  choices?: Array<{
    delta?: { content?: string; reasoning_content?: string }
    finish_reason?: string | null
  }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}
