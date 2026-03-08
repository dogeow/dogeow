import type { AIProvider, GenerateOption } from './types'

export const PROMPT_TEMPLATES: Record<GenerateOption, (text: string, command?: string) => string> =
  {
    improve: text => `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`,
    fix: text => `请修正以下文本的语法和拼写错误：\n\n${text}`,
    shorter: text => `请将以下文本简化，保留核心信息：\n\n${text}`,
    longer: text => `请扩展以下文本，添加更多细节和信息：\n\n${text}`,
    continue: text => `请继续写下去：\n\n${text}`,
    zap: (text, command) => `${command}\n\n原文：${text}`,
  }

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
export const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`
export const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen3:0.6b'

export const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions'
export const GITHUB_PAT = process.env.GITHUB_PAT ?? ''
export const GITHUB_MODEL = 'openai/gpt-5-mini'

export const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ?? 'https://api.minimaxi.com/anthropic'
export const ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN ?? ''
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'MiniMax-M2.5-highspeed'

export const ZHIPUAI_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
export const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY ?? ''
export const ZHIPUAI_MODEL = 'glm-4.6v-flash'

const EMBEDDING_MODEL_PREFIXES = ['qwen3-embedding', 'embeddinggemma', 'nomic-embed-text']
export const isEmbeddingModel = (model: string) =>
  EMBEDDING_MODEL_PREFIXES.some(prefix => model.startsWith(prefix))

export const ZHIPUAI_TEXT_MODELS = new Set([
  'glm-5',
  'glm-4.7',
  'glm-4.7-flash',
  'glm-4.7-flashx',
  'glm-4.6',
  'glm-4.5-air',
  'glm-4.5-airx',
  'glm-4.5-flash',
  'glm-4-flash-250414',
  'glm-4-flashx-250414',
])

export const ZHIPUAI_VISION_MODELS = new Set(['glm-4.6v-flash', 'glm-4.6v'])
export const isLikelyZhipuModel = (candidate?: string): boolean =>
  !!candidate && candidate.startsWith('glm-')

export const generatePrompt = (option: GenerateOption, text: string, command?: string): string =>
  PROMPT_TEMPLATES[option]?.(text, command) ?? `请处理以下文本：\n\n${text}`

export const getAIProvider = (requestedProvider?: AIProvider): AIProvider => {
  if (requestedProvider === 'github' && GITHUB_PAT) return 'github'
  if (requestedProvider === 'minimax' && ANTHROPIC_AUTH_TOKEN) return 'minimax'
  if (requestedProvider === 'zhipuai' && ZHIPUAI_API_KEY) return 'zhipuai'
  if (requestedProvider === 'ollama') return 'ollama'
  if (GITHUB_PAT) return 'github'
  if (ANTHROPIC_AUTH_TOKEN) return 'minimax'
  return 'ollama'
}

export const getProviderFallbackMessage = (provider: AIProvider): string => {
  if (provider === 'github') {
    return 'AI 服务暂时不可用，请检查后端 GITHUB_PAT 环境变量及网络'
  }
  if (provider === 'minimax') {
    return 'AI 服务暂时不可用，请检查后端 ANTHROPIC_AUTH_TOKEN 环境变量及网络'
  }
  if (provider === 'zhipuai') {
    return 'AI 服务暂时不可用，请检查后端 ZHIPUAI_API_KEY 环境变量及网络'
  }
  return 'AI 服务暂时不可用，请确保 Ollama 服务正在运行'
}
