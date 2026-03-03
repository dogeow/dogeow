import { describe, expect, it } from 'vitest'
import { getRequestModel } from '../request-model'

describe('getRequestModel', () => {
  it('returns an empty model for github requests', () => {
    expect(getRequestModel('github', 'qwen2.5:0.5b')).toBe('')
  })

  it('returns an empty model for minimax requests', () => {
    expect(getRequestModel('minimax', 'qwen2.5:0.5b')).toBe('')
  })

  it('preserves the model for ollama requests', () => {
    expect(getRequestModel('ollama', 'qwen3:0.6b')).toBe('qwen3:0.6b')
  })

  it('preserves the model for zhipuai requests', () => {
    expect(getRequestModel('zhipuai', 'glm-4.7')).toBe('glm-4.7')
  })
})
