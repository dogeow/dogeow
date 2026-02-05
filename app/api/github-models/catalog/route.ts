import { NextRequest, NextResponse } from 'next/server'

const GITHUB_CATALOG_URL = 'https://models.github.ai/catalog/models'
const FETCH_TIMEOUT_MS = 20000

/**
 * GET /api/github-models/catalog
 * Header: Authorization: Bearer <PAT>（需 fine-grained PAT 且勾选 models:read）
 * 返回 GitHub Models 目录中的模型列表
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json(
      {
        error: '缺少 Authorization',
        detail: '请在请求头中携带 Authorization: Bearer <你的 GitHub PAT>',
      },
      { status: 401 }
    )
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(GITHUB_CATALOG_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'DogeOW/1.0',
      },
      cache: 'no-store',
    })
    clearTimeout(timeoutId)
    const text = await res.text()
    if (!res.ok) {
      let detail = text
      try {
        const errJson = text ? JSON.parse(text) : null
        if (errJson?.message) detail = errJson.message
        else if (errJson?.error)
          detail = typeof errJson.error === 'string' ? errJson.error : JSON.stringify(errJson.error)
      } catch {
        // keep raw text
      }
      if (res.status === 401) {
        detail = 'PAT 无效或已过期，请检查 GitHub Fine-grained PAT 是否勾选 models:read'
      } else if (res.status === 403) {
        detail =
          '无权限访问 Models，请确认 PAT 已勾选 Repository permissions → Contents: Read 或 Models 相关权限'
      }
      return NextResponse.json(
        { error: `GitHub catalog 请求失败: ${res.status}`, detail: String(detail).slice(0, 500) },
        { status: 200 }
      )
    }
    let raw: unknown
    try {
      raw = text ? JSON.parse(text) : null
    } catch {
      return NextResponse.json(
        { error: '响应解析失败', detail: 'GitHub 返回非 JSON' },
        { status: 200 }
      )
    }
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { models?: unknown })?.models)
        ? (raw as { models: Array<{ id: string; name?: string; publisher?: string }> }).models
        : Array.isArray((raw as { data?: unknown })?.data)
          ? (raw as { data: Array<{ id: string; name?: string; publisher?: string }> }).data
          : []
    const models = list.map((m: { id: string; name?: string; publisher?: string }) => ({
      id: m.id,
      name: m.name ?? m.id,
      publisher: m.publisher,
    }))
    return NextResponse.json({ models })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时', detail: '无法连接 models.github.ai，请检查网络或 VPN 后重试' },
        { status: 200 }
      )
    }
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GitHub catalog error:', e)
    return NextResponse.json(
      {
        error: '获取目录失败',
        detail:
          msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')
            ? '无法连接 GitHub Models 服务，请检查网络或稍后重试'
            : msg,
      },
      { status: 200 }
    )
  }
}
