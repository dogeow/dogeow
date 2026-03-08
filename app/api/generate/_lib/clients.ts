import {
  ANTHROPIC_AUTH_TOKEN,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_MODEL,
  DEFAULT_MODEL,
  GITHUB_MODEL,
  GITHUB_MODELS_URL,
  GITHUB_PAT,
  OLLAMA_CHAT_URL,
  OLLAMA_GENERATE_URL,
  ZHIPUAI_API_KEY,
  ZHIPUAI_BASE_URL,
  ZHIPUAI_MODEL,
  ZHIPUAI_TEXT_MODELS,
  ZHIPUAI_VISION_MODELS,
  isEmbeddingModel,
  isLikelyZhipuModel,
} from './config'
import type { ChatMessage } from './types'

export const callOllamaGenerateAPI = async (prompt: string, model?: string): Promise<Response> => {
  const requested = model ?? DEFAULT_MODEL
  const selectedModel = isEmbeddingModel(requested) ? DEFAULT_MODEL : requested
  const res = await fetch(OLLAMA_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      stream: true,
    }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  return res
}

export const callOllamaChatAPI = async (
  messages: ChatMessage[],
  model?: string
): Promise<Response> => {
  const requested = model ?? DEFAULT_MODEL
  const selectedModel = isEmbeddingModel(requested) ? DEFAULT_MODEL : requested
  const res = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
    }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  return res
}

export const callGitHubModelsAPI = async (messages: ChatMessage[]): Promise<Response> => {
  if (!GITHUB_PAT) {
    throw new Error('GitHub PAT 未配置，请在后端设置 GITHUB_PAT 环境变量')
  }
  const res = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_PAT}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      model: GITHUB_MODEL,
      messages,
      stream: true,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.message) detail = data.message
      else if (data?.error) {
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      }
    } catch {}
    throw new Error(`GitHub Models API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}

export const callMiniMaxAPI = async (messages: ChatMessage[]): Promise<Response> => {
  if (!ANTHROPIC_AUTH_TOKEN) {
    throw new Error('MiniMax Token 未配置，请设置 ANTHROPIC_AUTH_TOKEN 环境变量')
  }

  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

  const systemMessage =
    messages.find(m => m.role === 'system')?.content ?? '你是一个有用的AI助理，请用中文回答问题。'

  const res = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${ANTHROPIC_AUTH_TOKEN}`,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      messages: anthropicMessages,
      system: systemMessage,
      stream: true,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.error?.message) detail = data.error.message
      else if (data?.error) {
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      }
    } catch {}
    throw new Error(`MiniMax API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}

export const callZhipuAIAPI = async (
  messages: ChatMessage[],
  images?: string[],
  imageUrl?: string,
  model?: string
): Promise<Response> => {
  if (!ZHIPUAI_API_KEY) {
    throw new Error('智谱AI API Key 未配置，请设置 ZHIPUAI_API_KEY 环境变量')
  }

  const hasImage = !!(images && images.length > 0) || !!imageUrl
  let selectedModel = 'glm-4.7'
  if (hasImage) {
    if (!model || ZHIPUAI_TEXT_MODELS.has(model)) {
      selectedModel = ZHIPUAI_MODEL
    } else if (ZHIPUAI_VISION_MODELS.has(model) || isLikelyZhipuModel(model)) {
      selectedModel = model
    } else {
      selectedModel = ZHIPUAI_MODEL
    }
  } else if (isLikelyZhipuModel(model)) {
    selectedModel = model ?? 'glm-4.7'
  }

  const contents: Array<{ type: string; image_url?: { url: string }; text?: string }> = []
  if (images && images.length > 0) {
    for (const image of images) {
      contents.push({ type: 'image_url', image_url: { url: image } })
    }
  } else if (imageUrl) {
    contents.push({ type: 'image_url', image_url: { url: imageUrl } })
  }

  const filteredMessages = messages.filter(m => m.role !== 'system')
  const lastUserMessage = [...filteredMessages].reverse().find(m => m.role === 'user')
  const latestUserText =
    filteredMessages[filteredMessages.length - 1]?.role === 'user'
      ? filteredMessages[filteredMessages.length - 1].content
      : (lastUserMessage?.content ?? '')

  if (latestUserText) {
    contents.push({ type: 'text', text: latestUserText })
  }

  const systemMessage =
    messages.find(m => m.role === 'system')?.content ?? '你是一个有用的AI助理，请用中文回答问题。'

  const lastUserContent: string | typeof contents =
    hasImage && contents.length > 0 ? contents : latestUserText

  const historyWithoutLastUser = [...filteredMessages]
  if (historyWithoutLastUser[historyWithoutLastUser.length - 1]?.role === 'user') {
    historyWithoutLastUser.pop()
  }

  const res = await fetch(`${ZHIPUAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ZHIPUAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemMessage },
        ...historyWithoutLastUser,
        { role: 'user', content: lastUserContent },
      ],
      stream: true,
      thinking: { type: 'enabled' as const },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.message) detail = data.message
      else if (data?.error) {
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      }
    } catch {}
    throw new Error(`智谱AI API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}
