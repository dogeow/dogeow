import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments, loadAllDocuments } from '@/lib/knowledge/search'
import { searchWithRAG } from '@/lib/knowledge/rag-search'
import { getKnowledgeConfig, type KnowledgeSearchMethod } from '@/lib/knowledge/config'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface KnowledgeChatRequestBody {
  messages?: ChatMessage[]
  query?: string
  useContext?: boolean // 是否使用知识库上下文
  searchMethod?: KnowledgeSearchMethod // 搜索方法：'simple' 或 'rag'
  model?: string // Ollama 模型名称
}

// Ollama配置
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b'

// 调用Ollama Chat API
const callOllamaChatAPI = async (messages: ChatMessage[], model?: string): Promise<Response> => {
  const selectedModel = model || DEFAULT_MODEL
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

// 转义JSON字符串
const escapeJsonString = (str: string) =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

// 创建流式响应
function createStreamResponse(ollamaResponse: Response, promptTokens: number): Response {
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

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue

            try {
              const data = JSON.parse(line)

              const content = data.response || data.message?.content || ''
              if (content) {
                const escapedResponse = escapeJsonString(content)
                controller.enqueue(encoder.encode(`0:"${escapedResponse}"\n`))
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

        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer)
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

/**
 * 构建包含知识库上下文的系统提示
 */
async function buildSystemPromptWithContext(
  query: string,
  searchMethod?: KnowledgeSearchMethod
): Promise<string> {
  try {
    const config = getKnowledgeConfig()
    const method = searchMethod || config.searchMethod

    let results: Array<{
      doc: { title: string; slug: string; content: string }
      snippet: string
      score?: number
      similarity?: number
    }> = []

    // 根据方法选择搜索策略
    if (method === 'rag') {
      console.log('[知识库搜索] 使用 RAG 方法')
      const ragResults = await searchWithRAG(query, 5)
      results = ragResults.map(r => ({
        doc: r.doc,
        snippet: r.snippet,
        similarity: r.similarity,
      }))
    } else {
      console.log('[知识库搜索] 使用简单关键词匹配方法')
      const simpleResults = await searchDocuments(query, 5)
      results = simpleResults.map(r => ({
        doc: r.doc,
        snippet: r.snippet,
        score: r.score,
      }))
    }

    console.log(`[知识库搜索] 查询: "${query}", 找到 ${results.length} 个相关文档`)

    // 检查是否是询问知识库内容的通用问题
    const isGeneralQuery = /知识库|内容|有什么|哪些|包含/.test(query.toLowerCase())

    if (results.length === 0) {
      // 尝试加载所有文档用于通用查询
      if (isGeneralQuery) {
        const allDocs = await loadAllDocuments()
        if (allDocs.length > 0) {
          const docList = allDocs.map((doc, index) => `${index + 1}. ${doc.title}`).join('\n')
          return `你是 DogeOW 网站的作者本人。DogeOW 是一个集学习、生活、工作于一体的综合性平台。

你的知识库包含以下 ${allDocs.length} 个文档：

${docList}

当用户询问你的知识库内容时，请用中文以第一人称"我"回答，例如"我的知识库包含以下内容..."。`
        }
      }

      return `你是 DogeOW 网站的作者本人。DogeOW 是一个集学习、生活、工作于一体的综合性平台。

用户问题：${query}

回答规则：
1. 对于常识性问题（如知名公司、人物、概念等），可以直接使用通用知识回答，不需要说明"不在知识库中"
2. 对于一般性问答、闲聊等，可以直接回答，保持友好和有用的态度
3. 以第一人称"我"回答问题，代表 DogeOW 网站作者本人
4. 如果是关于你个人或 DogeOW 网站的具体问题但知识库中没有，可以如实说明"我的知识库中没有相关信息，但可以聊聊..."
5. 只有在回答关于你个人或 DogeOW 网站的具体问题时，才需要说明是否在知识库中

请用中文以第一人称"我"回答问题。`
    }

    // 构建上下文
    const contextParts = results.map((result, index) => {
      // 对于通用查询，显示完整内容或摘要
      const snippet =
        isGeneralQuery && result.doc.content.length < 500 ? result.doc.content : result.snippet
      return `## 文档 ${index + 1}: ${result.doc.title}\n\n${snippet}\n`
    })

    const context = contextParts.join('\n---\n\n')

    // 列出所有文档标题，方便引用
    const docTitles = results
      .map((result, index) => `文档 ${index + 1}: ${result.doc.title}`)
      .join('\n')

    return `你是 DogeOW 网站的作者本人。DogeOW 是一个集学习、生活、工作于一体的综合性平台。

重要规则：
1. 当用户询问关于你的问题时，请以第一人称"我"回答，代表 DogeOW 网站作者本人
2. 优先使用以下知识库内容回答关于你个人或 DogeOW 网站的问题
3. 对于常识性问题（如知名公司、人物、概念等），可以直接使用通用知识回答
4. 如果知识库中没有相关信息，以第一人称告诉用户"我的知识库中没有相关信息"
5. 回答时不要使用"根据文档X"这样的格式，直接以第一人称回答问题即可

知识库文档列表：
${docTitles}

知识库内容：
${context}

请用中文以第一人称"我"回答问题，优先使用知识库内容，但也可以使用通用知识回答常识性问题。`
  } catch (error) {
    console.error('构建知识库上下文失败:', error)
    return `你是 DogeOW 网站的作者本人。DogeOW 是一个集学习、生活、工作于一体的综合性平台。由于技术错误，无法加载知识库内容。

请以第一人称"我"告诉用户："抱歉，我的知识库加载失败，请稍后重试。"`
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      query,
      useContext = true,
      searchMethod,
      model,
    }: KnowledgeChatRequestBody = await request.json()

    // 如果没有 messages，使用 query 创建单次对话
    let chatMessages: ChatMessage[]

    if (messages && messages.length > 0) {
      chatMessages = [...messages]
    } else if (query) {
      chatMessages = [
        {
          role: 'user',
          content: query,
        },
      ]
    } else {
      return NextResponse.json({ error: '缺少必要参数：messages 或 query' }, { status: 400 })
    }

    // 如果启用上下文，构建包含知识库的系统提示
    if (useContext) {
      const userQuery = messages?.[messages.length - 1]?.content || query || ''
      const systemPrompt = await buildSystemPromptWithContext(userQuery, searchMethod)

      // 确保有 system 消息
      const hasSystem = chatMessages.some(m => m.role === 'system')
      if (!hasSystem) {
        chatMessages = [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...chatMessages,
        ]
      } else {
        // 替换现有的 system 消息
        chatMessages = chatMessages.map(m =>
          m.role === 'system' ? { ...m, content: systemPrompt } : m
        )
      }
    } else {
      // 不使用上下文，添加默认 system 消息
      const hasSystem = chatMessages.some(m => m.role === 'system')
      if (!hasSystem) {
        chatMessages = [
          {
            role: 'system',
            content:
              '你是 DogeOW 网站的作者本人。DogeOW 是一个集学习、生活、工作于一体的综合性平台。请用中文以第一人称"我"回答问题。',
          },
          ...chatMessages,
        ]
      }
    }

    // 调用 Ollama API
    const ollamaResponse = await callOllamaChatAPI(chatMessages, model)

    // 计算 prompt tokens
    const promptTokens = Math.ceil(chatMessages.map(m => m.content).join('').length / 4)

    return createStreamResponse(ollamaResponse, promptTokens)
  } catch (error: unknown) {
    console.error('知识库问答API错误:', error)
    const errorMessage =
      error instanceof Error
        ? error.message.includes('fetch')
          ? 'AI服务暂时不可用，请确保Ollama服务正在运行'
          : error.message
        : 'AI服务发生未知错误'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
