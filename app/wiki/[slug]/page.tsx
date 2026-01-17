import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { readArticleSourceBySlug } from '@/lib/wiki/mdx'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function WikiArticlePage({ params }: Props) {
  const { slug } = await params
  const source = await readArticleSourceBySlug(slug)
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/note" style={{ color: '#2563eb' }}>
          ← 返回笔记
        </Link>
      </div>
      <article className="prose prose-slate max-w-none">
        <MDXRemote
          source={source}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
            },
          }}
        />
      </article>
    </div>
  )
}
