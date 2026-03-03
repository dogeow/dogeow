import { NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`
const OLLAMA_SHOW_URL = `${OLLAMA_BASE_URL}/api/show`

interface OllamaTagModel {
  name: string
  model?: string
  size?: number
  modified_at?: string
  details?: {
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
    format?: string
  }
}

interface OllamaTagsResponse {
  models?: OllamaTagModel[]
}

interface OllamaShowResponse {
  capabilities?: string[]
  details?: {
    family?: string
    families?: string[]
    parent_model?: string
    parameter_size?: string
    quantization_level?: string
    format?: string
  }
  model_info?: Record<string, unknown>
}

interface OllamaModelListItem {
  name: string
  size?: number
  modifiedAt?: string
  family?: string
  parameterSize?: string
  quantizationLevel?: string
}

const EMBEDDING_NAME_PATTERNS = [
  /^embeddinggemma(?::|$)/i,
  /^nomic-embed-text(?::|$)/i,
  /^qwen\d*(?:\.\d+)?-embedding(?::|$)/i,
  /^all-minilm(?::|$)/i,
  /^mxbai-embed-large(?::|$)/i,
  /^bge-/i,
  /^snowflake-arctic-embed/i,
]

const EMBEDDING_FAMILY_PATTERNS = [/embed/i, /^bert$/i, /bert/i]

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function isEmbeddingByHeuristic(model: OllamaTagModel, show?: OllamaShowResponse): boolean {
  const name = model.name ?? ''
  const families = [
    model.details?.family,
    ...(model.details?.families ?? []),
    show?.details?.family,
    ...(show?.details?.families ?? []),
  ]
    .filter(Boolean)
    .join(' ')

  if (EMBEDDING_NAME_PATTERNS.some(pattern => pattern.test(name))) {
    return true
  }

  return EMBEDDING_FAMILY_PATTERNS.some(pattern => pattern.test(families))
}

function isChatCapableModel(model: OllamaTagModel, show?: OllamaShowResponse): boolean {
  const capabilities = show?.capabilities ?? []
  if (capabilities.length > 0) {
    if (capabilities.includes('completion')) {
      return true
    }

    if (capabilities.includes('embedding')) {
      return false
    }
  }

  return !isEmbeddingByHeuristic(model, show)
}

export async function GET() {
  try {
    const tags = await fetchJson<OllamaTagsResponse>(OLLAMA_TAGS_URL)
    const models = tags.models ?? []

    const enriched = await Promise.all(
      models.map(async model => {
        try {
          const show = await fetchJson<OllamaShowResponse>(OLLAMA_SHOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: model.name }),
          })

          return { model, show }
        } catch {
          return { model, show: undefined }
        }
      })
    )

    const chatModels: OllamaModelListItem[] = enriched
      .filter(({ model, show }) => isChatCapableModel(model, show))
      .map(({ model, show }) => ({
        name: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
        family: show?.details?.family ?? model.details?.family,
        parameterSize: show?.details?.parameter_size ?? model.details?.parameter_size,
        quantizationLevel: show?.details?.quantization_level ?? model.details?.quantization_level,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ models: chatModels })
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法获取 Ollama 模型列表'
    return NextResponse.json({ error: message, models: [] }, { status: 503 })
  }
}
