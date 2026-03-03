export type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

export function getRequestModel(provider: AIProvider, model: string): string {
  if (provider === 'github' || provider === 'minimax') {
    return ''
  }

  return model
}
