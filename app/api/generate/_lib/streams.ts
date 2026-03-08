import type { GitHubChunk, MiniMaxChunk, OllamaResponse, ZhipuAIChunk } from './types'

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'x-vercel-ai-data-stream': 'v1',
}

export const escapeJsonString = (str: string): string =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

export function createZhipuAIStreamResponse(zhipuaiResponse: Response): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = zhipuaiResponse.body?.getReader()
      if (!reader) return controller.error(new Error('无法获取响应流'))

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
                    usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens },
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
                controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
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
            } catch {}
          }
        }

        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'stop',
              usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens },
            })}\n`
          )
        )
        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}

export function createMiniMaxStreamResponse(minimaxResponse: Response): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = minimaxResponse.body?.getReader()
      if (!reader) return controller.error(new Error('无法获取响应流'))

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
                    usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens },
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
                  controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
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
            } catch {}
          }
        }

        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'stop',
              usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens },
            })}\n`
          )
        )
        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}

export function createGitHubStreamResponse(
  githubResponse: Response,
  promptTokens: number
): Response {
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
      if (!reader) return controller.error(new Error('无法获取响应流'))

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
                controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
              if (data.choices?.[0]?.finish_reason) {
                controller.enqueue(
                  encoder.encode(
                    `d:${JSON.stringify({
                      ...baseFinalData(totalTokens),
                      ...(data.usage && { usage: data.usage }),
                    })}\n`
                  )
                )
                controller.close()
                return
              }
            } catch {}
          }
        }

        if (buffer.startsWith('data: ')) {
          const dataStr = buffer.slice(6)
          if (dataStr !== '[DONE]') {
            try {
              const data: GitHubChunk = JSON.parse(dataStr)
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
            } catch {}
          }
        }
        controller.enqueue(encoder.encode(`d:${JSON.stringify(baseFinalData(totalTokens))}\n`))
        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}

export function createStreamResponse(
  ollamaResponse: Response,
  prompt: string,
  promptTokensOverride?: number
): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body?.getReader()
      if (!reader) return controller.error(new Error('无法获取响应流'))

      let buffer = ''
      let totalTokens = 0
      const promptTokens = promptTokensOverride ?? Math.ceil(prompt.length / 4)

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
              const data: OllamaResponse = JSON.parse(line)
              const content = data.response ?? data.message?.content ?? ''
              if (content) {
                controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
              if (data.done) {
                controller.enqueue(
                  encoder.encode(
                    `d:${JSON.stringify({
                      finishReason: 'stop',
                      usage: {
                        promptTokens,
                        completionTokens: totalTokens,
                        totalTokens: promptTokens + totalTokens,
                      },
                    })}\n`
                  )
                )
                controller.close()
                return
              }
            } catch {}
          }
        }

        if (buffer.trim()) {
          try {
            const data: OllamaResponse = JSON.parse(buffer)
            if (data.done) {
              controller.enqueue(
                encoder.encode(
                  `d:${JSON.stringify({
                    finishReason: 'stop',
                    usage: {
                      promptTokens,
                      completionTokens: totalTokens,
                      totalTokens: promptTokens + totalTokens,
                    },
                  })}\n`
                )
              )
            }
          } catch {}
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}
