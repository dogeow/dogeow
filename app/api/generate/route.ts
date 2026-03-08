import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_MODEL,
  generatePrompt,
  getAIProvider,
  getProviderFallbackMessage,
} from './_lib/config'
import {
  callGitHubModelsAPI,
  callMiniMaxAPI,
  callOllamaChatAPI,
  callOllamaGenerateAPI,
  callZhipuAIAPI,
} from './_lib/clients'
import {
  createGitHubStreamResponse,
  createMiniMaxStreamResponse,
  createStreamResponse,
  createZhipuAIStreamResponse,
} from './_lib/streams'
import type { ChatMessage, GenerateRequestBody } from './_lib/types'

function buildChatMessages(messages: ChatMessage[], command?: string): ChatMessage[] {
  if (messages.some(m => m.role === 'system')) return messages
  return [
    {
      role: 'system',
      content: command ?? '你是一个有用的AI助理，请用中文回答问题。',
    },
    ...messages,
  ]
}

function getPromptTokens(messages: ChatMessage[]): number {
  return Math.ceil(messages.reduce((acc, message) => acc + message.content.length, 0) / 4)
}

function getErrorMessage(error: unknown, provider?: GenerateRequestBody['provider']): string {
  const isNetworkOrFetch = error instanceof Error && (error.message?.includes('fetch') ?? false)
  const actualProvider = getAIProvider(provider)
  if (error instanceof Error) {
    return isNetworkOrFetch ? getProviderFallbackMessage(actualProvider) : error.message
  }
  return 'AI服务发生未知错误'
}

async function handleChatRequest(body: GenerateRequestBody, chatMessages: ChatMessage[]) {
  const { provider, images, imageUrl, model } = body
  const actualProvider = getAIProvider(provider)
  const promptTokens = getPromptTokens(chatMessages)

  if (actualProvider === 'github') {
    const githubResponse = await callGitHubModelsAPI(chatMessages)
    return createGitHubStreamResponse(githubResponse, promptTokens)
  }

  if (actualProvider === 'minimax') {
    const minimaxResponse = await callMiniMaxAPI(chatMessages)
    return createMiniMaxStreamResponse(minimaxResponse)
  }

  if (actualProvider === 'zhipuai') {
    const zhipuaiResponse = await callZhipuAIAPI(chatMessages, images, imageUrl, model)
    return createZhipuAIStreamResponse(zhipuaiResponse)
  }

  const ollamaResponse = await callOllamaChatAPI(chatMessages, model)
  return createStreamResponse(ollamaResponse, '', promptTokens)
}

async function handleGenerateRequest(body: GenerateRequestBody) {
  const { option, text = '', command, model } = body

  if (!option || !text.trim()) {
    return NextResponse.json({ error: '缺少必要参数：option 和 text' }, { status: 400 })
  }

  const prompt = generatePrompt(option, text, command)
  const ollamaResponse = await callOllamaGenerateAPI(prompt, model ?? DEFAULT_MODEL)
  return createStreamResponse(ollamaResponse, prompt)
}

export async function POST(request: NextRequest) {
  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { messages, useChat = false, command, provider, images, imageUrl, model } = body
  const hasImages = !!(images && images.length > 0) || !!imageUrl

  try {
    console.log('[Generate API] 接收到的请求:', { provider, model, useChat, hasImages })
    console.log('[Generate API] 实际使用的 AI 提供商:', getAIProvider(provider))

    if (useChat && messages && messages.length > 0) {
      return await handleChatRequest(body, buildChatMessages(messages, command))
    }

    return await handleGenerateRequest(body)
  } catch (error: unknown) {
    console.error('AI API错误:', error)
    return NextResponse.json({ error: getErrorMessage(error, provider) }, { status: 500 })
  }
}
