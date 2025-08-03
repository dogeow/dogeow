import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import { POST } from '../route'

// Mock fetch
global.fetch = vi.fn()

describe('Generate API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body),
      cookies: {} as Record<string, string>,
      nextUrl: {} as URL,
      page: {} as Record<string, unknown>,
      ua: {} as Record<string, unknown>,
      headers: {} as Headers,
      method: 'POST',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      clone: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      signal: {} as AbortSignal,
      cache: 'default',
      credentials: 'same-origin',
      destination: 'document',
      integrity: '',
      keepalive: false,
      mode: 'cors',
      redirect: 'follow',
      referrer: '',
      referrerPolicy: 'no-referrer',
      url: 'http://localhost:3000/api/generate',
    } as unknown as NextRequest
  }

  it('should handle invalid option', async () => {
    const request = createMockRequest({
      option: 'invalid',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle missing text', async () => {
    const request = createMockRequest({
      option: 'improve',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle Ollama API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const request = createMockRequest({
      option: 'improve',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const request = createMockRequest({
      option: 'improve',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle improve option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'improve',
      text: '原始文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt: '请改进以下文本的表达和流畅性，保持原意不变：\n\n原始文本',
        stream: true,
      }),
    })
  })

  it('should handle fix option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'fix',
      text: '有错误的文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt: '请修正以下文本的语法和拼写错误：\n\n有错误的文本',
        stream: true,
      }),
    })
  })

  it('should handle zap option with command', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'zap',
      text: '原文内容',
      command: '自定义命令',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt: '自定义命令\n\n原文：原文内容',
        stream: true,
      }),
    })
  })
})
