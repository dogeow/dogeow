import { NextRequest, NextResponse } from 'next/server'
import { loadAllDocuments } from '@/lib/knowledge/search'
import { buildVectorIndex, saveVectorIndex, loadVectorIndex } from '@/lib/knowledge/vector-store'

/**
 * 构建向量索引的 API 端点
 * POST /api/knowledge/build-index
 */
export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json().catch(() => ({ force: false }))

    // 检查索引是否已存在
    const existingIndex = loadVectorIndex()
    if (existingIndex && !force) {
      return NextResponse.json({
        success: true,
        message: '向量索引已存在',
        indexSize: existingIndex.documents.length,
        createdAt: existingIndex.createdAt,
        updatedAt: existingIndex.updatedAt,
      })
    }

    // 加载所有文档
    const documents = await loadAllDocuments()
    if (documents.length === 0) {
      // 获取调试信息
      let apiBaseUrl =
        process.env.API_INTERNAL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:8000/api'

      // 确保 URL 以 /api 结尾（如果环境变量是基础 URL）
      if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
        apiBaseUrl = apiBaseUrl.endsWith('/') ? `${apiBaseUrl}api` : `${apiBaseUrl}/api`
      }

      // 尝试直接测试后端 API
      let debugInfo: Record<string, unknown> = {
        apiUrl: apiBaseUrl,
        endpoint: `${apiBaseUrl}/notes/wiki/articles`,
      }

      try {
        const testResponse = await fetch(`${apiBaseUrl}/notes/wiki/articles`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        debugInfo.testResponseStatus = testResponse.status
        debugInfo.testResponseOk = testResponse.ok

        if (testResponse.ok) {
          const testData = await testResponse.json()
          debugInfo.testDataHasArticles = !!testData.articles
          debugInfo.testArticlesCount = testData.articles?.length || 0
        } else {
          debugInfo.testResponseText = await testResponse.text()
        }
      } catch (testError) {
        debugInfo.testError = testError instanceof Error ? testError.message : String(testError)
      }

      return NextResponse.json(
        {
          success: false,
          message: '没有找到任何文档',
          debug: debugInfo,
        },
        { status: 400 }
      )
    }

    // 构建向量索引
    const index = await buildVectorIndex(documents)

    // 保存索引
    saveVectorIndex(index)

    return NextResponse.json({
      success: true,
      message: '向量索引构建成功',
      indexSize: index.documents.length,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
    })
  } catch (error: unknown) {
    console.error('构建向量索引失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      {
        success: false,
        message: '构建向量索引失败',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * 获取索引状态
 * GET /api/knowledge/build-index
 */
export async function GET() {
  try {
    const index = loadVectorIndex()
    if (!index) {
      return NextResponse.json({
        exists: false,
        message: '向量索引不存在',
      })
    }

    return NextResponse.json({
      exists: true,
      indexSize: index.documents.length,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
      version: index.version,
    })
  } catch (error: unknown) {
    console.error('获取索引状态失败:', error)
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
