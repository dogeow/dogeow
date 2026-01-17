import { NextResponse } from 'next/server'
import { loadAllDocuments } from '@/lib/knowledge/search'

/**
 * 获取所有文档列表的 API 端点
 * GET /api/knowledge/documents
 */
export async function GET() {
  try {
    const documents = await loadAllDocuments()

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        title: doc.title,
        slug: doc.slug,
      })),
    })
  } catch (error: unknown) {
    console.error('获取文档列表失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      {
        success: false,
        message: '获取文档列表失败',
        error: errorMessage,
        documents: [],
      },
      { status: 500 }
    )
  }
}
