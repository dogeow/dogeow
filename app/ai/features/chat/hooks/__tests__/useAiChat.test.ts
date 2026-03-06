import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../useAiChat'

vi.mock('@/stores/authStore', () => {
  const mockStore = (() => null) as unknown as {
    getState: () => { token: string | null }
  }

  mockStore.getState = () => ({ token: null })

  return {
    default: mockStore,
  }
})

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useAiChat model loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('zhipuai_model')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not request Ollama models when dialog is closed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: false }))

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('requests Ollama models when dialog is open and provider is ollama', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'qwen3:0.6b', supportsVision: false }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/ollama/models')
    })
  })

  it('does not request Ollama models when provider is not ollama', async () => {
    localStorage.setItem('ai_provider', 'github')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
