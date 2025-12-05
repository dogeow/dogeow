import { NextResponse } from 'next/server'
import { readArticleSourceBySlug } from '@/lib/wiki/mdx'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const mdxSource = await readArticleSourceBySlug(slug)
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(mdxSource)
    const html = String(file)
    return NextResponse.json({ slug, html, source: mdxSource })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Not found'
    return NextResponse.json({ error: errorMessage }, { status: 404 })
  }
}
