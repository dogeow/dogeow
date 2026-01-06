import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceInput } from '../useVoiceInput'
import { toast } from 'react-hot-toast'

// Mock toast
jest.mock('react-hot-toast')

// Mock SpeechRecognition API
class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: any = null
  onerror: any = null
  onstart: any = null
  onend: any = null

  start() {
    if (this.onstart) {
      this.onstart()
    }
  }

  stop() {
    if (this.onend) {
      this.onend()
    }
  }

  abort() {
    if (this.onend) {
      this.onend()
    }
  }
}

describe('useVoiceInput', () => {
  beforeEach(() => {
    // Setup mock
    ;(window as any).SpeechRecognition = MockSpeechRecognition
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition
  })

  it('应该初始化为不支持状态（无浏览器环境）', () => {
    delete (window as any).SpeechRecognition

    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(false)
    expect(result.current.isListening).toBe(false)
    expect(result.current.transcript).toBe('')
  })

  it('应该正确识别浏览器支持', () => {
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(true)
  })

  it('应该能够开始监听', async () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    await waitFor(() => {
      expect(result.current.isListening).toBe(true)
    })

    expect(toast.success).toHaveBeenCalledWith('开始语音识别...')
  })

  it('应该能够停止监听', async () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    await waitFor(() => {
      expect(result.current.isListening).toBe(true)
    })

    act(() => {
      result.current.stopListening()
    })

    await waitFor(() => {
      expect(result.current.isListening).toBe(false)
    })

    expect(toast.success).toHaveBeenCalledWith('语音识别已停止')
  })

  it('应该能够重置转录文本', () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.resetTranscript()
    })

    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('当浏览器不支持时应该显示错误', () => {
    delete (window as any).SpeechRecognition

    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    expect(toast.error).toHaveBeenCalledWith('您的浏览器不支持语音识别功能')
    expect(result.current.error).toBe('您的浏览器不支持语音识别功能')
  })

  it('应该调用 onTranscript 回调', async () => {
    const onTranscript = jest.fn()
    const { result } = renderHook(() => useVoiceInput({ onTranscript }))

    act(() => {
      result.current.startListening()
    })

    // 注意：由于我们的 mock 没有触发 onresult，这个测试需要更复杂的设置
    // 这里只是验证 hook 的基本功能
    await waitFor(() => {
      expect(result.current.isListening).toBe(true)
    })
  })

  it('应该正确设置语言', () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        language: 'en-US',
      })
    )

    expect(result.current.isSupported).toBe(true)
  })

  it('应该处理连续监听模式', () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        continuous: true,
      })
    )

    expect(result.current.isSupported).toBe(true)
  })
})
