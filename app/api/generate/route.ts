import { NextRequest, NextResponse } from 'next/server'

// 选项类型
type GenerateOption = 'improve' | 'fix' | 'shorter' | 'longer' | 'continue' | 'zap'

// 消息类型（用于连续对话）
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 请求体类型
interface GenerateRequestBody {
  option: GenerateOption
  command?: string
  text?: string
  // 连续对话支持
  messages?: ChatMessage[]
  useChat?: boolean // 是否使用 chat 模式
  model?: string // Ollama 模型名称
  provider?: AIProvider // AI 提供商
  // 视觉理解支持（智谱AI）
  images?: string[] // base64 编码的图片数组
  imageUrl?: string // 图片URL
}

// GitHub Models SSE 响应片段
interface GitHubChunk {
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

// Ollama响应类型
interface OllamaResponse {
  response?: string
  message?: {
    role: string
    content: string
  }
  done?: boolean
}

// 提示词模板
const PROMPT_TEMPLATES: Record<GenerateOption, (text: string, command?: string) => string> = {
  improve: text => `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`,
  fix: text => `请修正以下文本的语法和拼写错误：\n\n${text}`,
  shorter: text => `请将以下文本简化，保留核心信息：\n\n${text}`,
  longer: text => `请扩展以下文本，添加更多细节和信息：\n\n${text}`,
  continue: text => `请继续写下去：\n\n${text}`,
  zap: (text, command) => `${command}\n\n原文：${text}`,
}

// Ollama 配置
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`
const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:0.5b'

// GitHub Models 配置
const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions'
const GITHUB_PAT = process.env.GITHUB_PAT ?? ''
const GITHUB_MODEL = 'openai/gpt-5-mini'

// MiniMax (Anthropic 兼容) 配置
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL ?? 'https://api.minimaxi.com/anthropic'
const ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN ?? ''
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'MiniMax-M2.5-highspeed'

// 智谱AI (ZhipuAI) 配置
const ZHIPUAI_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY ?? ''
const ZHIPUAI_MODEL = 'glm-4.6v-flash'

// AI 提供商类型
type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

// embedding 模型仅用于检索，不能用于 Chat/Generate API，需回退为对话模型
const EMBEDDING_MODEL_PREFIXES = ['qwen3-embedding', 'embeddinggemma', 'nomic-embed-text']
const isEmbeddingModel = (model: string) =>
  EMBEDDING_MODEL_PREFIXES.some(prefix => model.startsWith(prefix))

// 转义JSON字符串
const escapeJsonString = (str: string): string =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

// 生成提示词
const generatePrompt = (option: GenerateOption, text: string, command?: string): string =>
  PROMPT_TEMPLATES[option]?.(text, command) ?? `请处理以下文本：\n\n${text}`

// 调用Ollama Generate API（单次生成）
const callOllamaGenerateAPI = async (prompt: string, model?: string): Promise<Response> => {
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

// 调用Ollama Chat API（连续对话）
const callOllamaChatAPI = async (messages: ChatMessage[], model?: string): Promise<Response> => {
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

// 调用 GitHub Models API（chat completions，流式）
const callGitHubModelsAPI = async (messages: ChatMessage[]): Promise<Response> => {
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
      else if (data?.error)
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    } catch {
      // 非 JSON 时保留原始 text
    }
    throw new Error(`GitHub Models API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}

// MiniMax (Anthropic 兼容) 响应类型
interface MiniMaxChunk {
  type: string
  index?: number
  delta?: { type: string; text?: string }
  usage?: { input_tokens: number; output_tokens: number }
  message?: { role: string; content: string }
}

// 调用 MiniMax (Anthropic 兼容) API
const callMiniMaxAPI = async (messages: ChatMessage[]): Promise<Response> => {
  if (!ANTHROPIC_AUTH_TOKEN) {
    throw new Error('MiniMax Token 未配置，请设置 ANTHROPIC_AUTH_TOKEN 环境变量')
  }

  console.log('[Generate API] MiniMax 配置:', {
    baseUrl: ANTHROPIC_BASE_URL,
    model: ANTHROPIC_MODEL,
    fullUrl: `${ANTHROPIC_BASE_URL}/v1/messages`,
    tokenPrefix: ANTHROPIC_AUTH_TOKEN.substring(0, 10) + '...',
  })

  // 转换消息格式为 Anthropic 格式
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

  // 从消息中提取 system prompt
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
      else if (data?.error)
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    } catch {
      // 非 JSON 时保留原始 text
    }
    console.error('[MiniMax API Error]', {
      status: res.status,
      detail,
      model: ANTHROPIC_MODEL,
      fullUrl: `${ANTHROPIC_BASE_URL}/v1/messages`,
      responseText: text,
    })
    throw new Error(`MiniMax API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}

// 智谱AI (ZhipuAI) 响应类型
interface ZhipuAIChunk {
  choices?: Array<{
    delta?: { content?: string; reasoning_content?: string }
    finish_reason?: string | null
  }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

// 调用智谱AI API（视觉理解）
const callZhipuAIAPI = async (
  messages: ChatMessage[],
  images?: string[],
  imageUrl?: string,
  model?: string
): Promise<Response> => {
  if (!ZHIPUAI_API_KEY) {
    throw new Error('智谱AI API Key 未配置，请设置 ZHIPUAI_API_KEY 环境变量')
  }

  // 使用传入的模型或默认模型
  const selectedModel = model || 'glm-4.7'

  // 构建消息内容
  const contents: Array<{ type: string; image_url?: { url: string }; text?: string }> = []

  // 添加图片（仅支持 URL）
  if (images && images.length > 0) {
    for (const image of images) {
      contents.push({
        type: 'image_url',
        image_url: { url: image },
      })
    }
  } else if (imageUrl) {
    contents.push({
      type: 'image_url',
      image_url: { url: imageUrl },
    })
  }

  // 添加文本内容
  const userMessage = messages.find(m => m.role === 'user')
  if (userMessage?.content) {
    contents.push({
      type: 'text',
      text: userMessage.content,
    })
  }

  // 过滤掉 system 消息用于API调用
  const filteredMessages = messages.filter(m => m.role !== 'system')

  // 从消息中提取 system prompt
  const systemMessage =
    messages.find(m => m.role === 'system')?.content ?? '你是一个有用的AI助理，请用中文回答问题。'

  const requestBody = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemMessage },
      ...filteredMessages.slice(0, -1),
      {
        role: 'user',
        content:
          contents.length > 0 ? contents : [{ type: 'text', text: userMessage?.content ?? '' }],
      },
    ],
    stream: true,
    thinking: {
      type: 'enabled',
    },
  }

  const res = await fetch(`${ZHIPUAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ZHIPUAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.message) detail = data.message
      else if (data?.error)
        detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    } catch {
      // 非 JSON 时保留原始 text
    }
    throw new Error(`智谱AI API (${res.status}): ${detail}`.slice(0, 500))
  }
  return res
}

// 将智谱AI SSE 流转换为与 Ollama 相同的输出格式
function createZhipuAIStreamResponse(zhipuaiResponse: Response): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = zhipuaiResponse.body?.getReader()
      if (!reader) {
        controller.error(new Error('无法获取响应流'))
        return
      }

      let buffer = ''
      let totalTokens = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') {
              controller.enqueue(
                encoder.encode(
                  `d:${JSON.stringify({
                    finishReason: 'stop',
                    usage: {
                      promptTokens: 0,
                      completionTokens: totalTokens,
                      totalTokens: totalTokens,
                    },
                  })}\n`
                )
              )
              controller.close()
              return
            }
            try {
              const data: ZhipuAIChunk = JSON.parse(dataStr)
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                const escaped = escapeJsonString(content)
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
              if (data.choices?.[0]?.finish_reason) {
                controller.enqueue(
                  encoder.encode(
                    `d:${JSON.stringify({
                      finishReason: 'stop',
                      usage: {
                        promptTokens: data.usage?.prompt_tokens ?? 0,
                        completionTokens: data.usage?.completion_tokens ?? totalTokens,
                        totalTokens: data.usage?.total_tokens ?? totalTokens,
                      },
                    })}\n`
                  )
                )
                controller.close()
                return
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'stop',
              usage: {
                promptTokens: 0,
                completionTokens: totalTokens,
                totalTokens: totalTokens,
              },
            })}\n`
          )
        )
        controller.close()
      } catch (e) {
        console.error('智谱AI 流处理错误:', e)
        controller.error(e)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  })
}

// 将 MiniMax SSE 流转换为与 Ollama 相同的输出格式
function createMiniMaxStreamResponse(minimaxResponse: Response): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = minimaxResponse.body?.getReader()
      if (!reader) {
        controller.error(new Error('无法获取响应流'))
        return
      }

      let buffer = ''
      let totalTokens = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') {
              controller.enqueue(
                encoder.encode(
                  `d:${JSON.stringify({
                    finishReason: 'stop',
                    usage: {
                      promptTokens: 0,
                      completionTokens: totalTokens,
                      totalTokens: totalTokens,
                    },
                  })}\n`
                )
              )
              controller.close()
              return
            }
            try {
              const data: MiniMaxChunk = JSON.parse(dataStr)
              if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
                const content = data.delta.text
                if (content) {
                  const escaped = escapeJsonString(content)
                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`))
                  totalTokens += Math.ceil(content.length / 4)
                }
              }
              if (data.type === 'message_stop') {
                controller.enqueue(
                  encoder.encode(
                    `d:${JSON.stringify({
                      finishReason: 'stop',
                      usage: {
                        promptTokens: data.usage?.input_tokens ?? 0,
                        completionTokens: data.usage?.output_tokens ?? totalTokens,
                        totalTokens:
                          (data.usage?.input_tokens ?? 0) +
                          (data.usage?.output_tokens ?? totalTokens),
                      },
                    })}\n`
                  )
                )
                controller.close()
                return
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'stop',
              usage: {
                promptTokens: 0,
                completionTokens: totalTokens,
                totalTokens: totalTokens,
              },
            })}\n`
          )
        )
        controller.close()
      } catch (e) {
        console.error('MiniMax 流处理错误:', e)
        controller.error(e)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  })
}

// 将 GitHub SSE 流转换为与 Ollama 相同的输出格式（0:"content"\n, d:{...}\n）
function createGitHubStreamResponse(githubResponse: Response, promptTokens: number): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const baseFinalData = (totalTokens: number) => ({
    finishReason: 'stop' as const,
    usage: {
      promptTokens,
      completionTokens: totalTokens,
      totalTokens: promptTokens + totalTokens,
    },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const reader = githubResponse.body?.getReader()
      if (!reader) {
        controller.error(new Error('无法获取响应流'))
        return
      }

      let buffer = ''
      let totalTokens = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') {
              controller.enqueue(
                encoder.encode(`d:${JSON.stringify(baseFinalData(totalTokens))}\n`)
              )
              controller.close()
              return
            }
            try {
              const data: GitHubChunk = JSON.parse(dataStr)
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                const escaped = escapeJsonString(content)
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
              if (data.choices?.[0]?.finish_reason) {
                const finalData = {
                  ...baseFinalData(totalTokens),
                  ...(data.usage && { usage: data.usage }),
                }
                controller.enqueue(encoder.encode(`d:${JSON.stringify(finalData)}\n`))
                controller.close()
                return
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          const dataStr = buffer.slice(6)
          if (dataStr !== '[DONE]') {
            try {
              const data: GitHubChunk = JSON.parse(dataStr)
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                const escaped = escapeJsonString(content)
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
            } catch {
              // ignore
            }
          }
        }
        controller.enqueue(encoder.encode(`d:${JSON.stringify(baseFinalData(totalTokens))}\n`))
        controller.close()
      } catch (e) {
        console.error('GitHub 流处理错误:', e)
        controller.error(e)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  })
}

// 创建流式响应
function createStreamResponse(
  ollamaResponse: Response,
  prompt: string,
  promptTokensOverride?: number
): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body?.getReader()
      if (!reader) {
        controller.error(new Error('无法获取响应流'))
        return
      }

      let buffer = ''
      let totalTokens = 0
      // 更准确的token估算
      const promptTokens = promptTokensOverride ?? Math.ceil(prompt.length / 4)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // 累积缓冲区处理不完整的JSON行
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一个可能不完整的行

          for (const line of lines) {
            if (!line.trim()) continue

            try {
              const data: OllamaResponse = JSON.parse(line)

              // 支持 generate 和 chat 两种响应格式
              const content = data.response ?? data.message?.content ?? ''
              if (content) {
                const escapedResponse = escapeJsonString(content)
                controller.enqueue(encoder.encode(`0:"${escapedResponse}"\n`))
                // 更准确的token计算
                totalTokens += Math.ceil(content.length / 4)
              }

              if (data.done) {
                const finalData = {
                  finishReason: 'stop',
                  usage: {
                    promptTokens,
                    completionTokens: totalTokens,
                    totalTokens: promptTokens + totalTokens,
                  },
                }
                controller.enqueue(encoder.encode(`d:${JSON.stringify(finalData)}\n`))
                controller.close()
                return
              }
            } catch (e) {
              console.warn('JSON解析错误:', e, '行内容:', line)
            }
          }
        }

        // 处理剩余缓冲区
        if (buffer.trim()) {
          try {
            const data: OllamaResponse = JSON.parse(buffer)
            if (data.done) {
              const finalData = {
                finishReason: 'stop',
                usage: {
                  promptTokens,
                  completionTokens: totalTokens,
                  totalTokens: promptTokens + totalTokens,
                },
              }
              controller.enqueue(encoder.encode(`d:${JSON.stringify(finalData)}\n`))
            }
          } catch (e) {
            console.warn('处理剩余缓冲区时出错:', e)
          }
        }

        controller.close()
      } catch (e) {
        console.error('流处理错误:', e)
        controller.error(e)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  })
}

// 根据环境变量决定使用哪个 AI 服务（优先使用 GitHub Models）
const useGitHub = !!GITHUB_PAT
const useMiniMax = !!ANTHROPIC_AUTH_TOKEN
const useZhipuAI = !!ZHIPUAI_API_KEY

// 确定实际使用的 AI 提供商
const getAIProvider = (requestedProvider?: AIProvider, hasImages?: boolean): AIProvider => {
  // 如果有图片输入，优先使用智谱AI（视觉理解）
  if (hasImages && ZHIPUAI_API_KEY) return 'zhipuai'
  if (requestedProvider === 'github' && GITHUB_PAT) return 'github'
  if (requestedProvider === 'minimax' && ANTHROPIC_AUTH_TOKEN) return 'minimax'
  if (requestedProvider === 'zhipuai' && ZHIPUAI_API_KEY) return 'zhipuai'
  if (requestedProvider === 'ollama') return 'ollama'
  // 如果有图片输入但没有智谱AI，回退到其他提供商
  if (hasImages) {
    if (GITHUB_PAT) return 'github'
    if (ANTHROPIC_AUTH_TOKEN) return 'minimax'
  }
  // 默认优先级：GitHub > MiniMax > Ollama
  if (GITHUB_PAT) return 'github'
  if (ANTHROPIC_AUTH_TOKEN) return 'minimax'
  return 'ollama'
}

export async function POST(request: NextRequest) {
  // 只读取一次 body
  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const {
    option,
    command,
    text = '',
    messages,
    useChat = false,
    model,
    provider,
    images,
    imageUrl,
  } = body

  // 检查是否有图片输入
  const hasImages = !!(images && images.length > 0) || !!imageUrl

  try {
    // 调试日志
    console.log('[Generate API] 接收到的请求:', { provider, model, useChat, hasImages })

    // 确定实际使用的 AI 提供商
    const actualProvider = getAIProvider(provider, hasImages)
    console.log('[Generate API] 实际使用的 AI 提供商:', actualProvider)

    // 如果使用 chat 模式且有 messages，使用连续对话
    if (useChat && messages && messages.length > 0) {
      const chatMessages: ChatMessage[] = messages.some(m => m.role === 'system')
        ? messages
        : [
            {
              role: 'system',
              content: command ?? '你是一个有用的AI助理，请用中文回答问题。',
            },
            ...messages,
          ]

      const promptTokens = Math.ceil(chatMessages.reduce((acc, m) => acc + m.content.length, 0) / 4)

      // 根据 AI 提供商调用不同的 API
      if (actualProvider === 'github') {
        const githubResponse = await callGitHubModelsAPI(chatMessages)
        return createGitHubStreamResponse(githubResponse, promptTokens)
      }

      if (actualProvider === 'minimax') {
        const minimaxResponse = await callMiniMaxAPI(chatMessages)
        return createMiniMaxStreamResponse(minimaxResponse)
      }

      // 智谱AI - 支持视觉理解
      if (actualProvider === 'zhipuai') {
        const zhipuaiResponse = await callZhipuAIAPI(chatMessages, images, imageUrl, model)
        return createZhipuAIStreamResponse(zhipuaiResponse)
      }

      // 默认使用 Ollama
      const ollamaResponse = await callOllamaChatAPI(chatMessages, model)
      return createStreamResponse(ollamaResponse, '', promptTokens)
    }

    // 兼容旧模式：单次生成（仅支持 Ollama）
    if (!option || !text.trim()) {
      return NextResponse.json({ error: '缺少必要参数：option 和 text' }, { status: 400 })
    }

    const prompt = generatePrompt(option, text, command)
    const ollamaResponse = await callOllamaGenerateAPI(prompt, model)
    return createStreamResponse(ollamaResponse, prompt)
  } catch (error: unknown) {
    console.error('AI API错误:', error)
    const isNetworkOrFetch = error instanceof Error && (error.message?.includes('fetch') ?? false)
    // 从请求体中提取 provider，如果不存在则使用默认值
    const actualProvider = getAIProvider(provider ?? undefined, hasImages)
    const fallbackMessage =
      actualProvider === 'github'
        ? 'AI 服务暂时不可用，请检查后端 GITHUB_PAT 环境变量及网络'
        : actualProvider === 'minimax'
          ? 'AI 服务暂时不可用，请检查后端 ANTHROPIC_AUTH_TOKEN 环境变量及网络'
          : actualProvider === 'zhipuai'
            ? 'AI 服务暂时不可用，请检查后端 ZHIPUAI_API_KEY 环境变量及网络'
            : 'AI 服务暂时不可用，请确保 Ollama 服务正在运行'
    const errorMessage =
      error instanceof Error
        ? isNetworkOrFetch
          ? fallbackMessage
          : error.message
        : 'AI服务发生未知错误'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
