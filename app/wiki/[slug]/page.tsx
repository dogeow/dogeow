import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { readArticleSourceBySlug } from '@/lib/wiki/mdx'

type Props = {
  params: { slug: string }
}

export default async function WikiArticlePage({ params }: Props) {
  const source = await readArticleSourceBySlug(params.slug)
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/wiki" style={{ color: '#2563eb' }}>
          ← 返回图谱
        </Link>
      </div>
      <article className="prose prose-slate max-w-none">
        {/* @ts-expect-error Async Server Component from next-mdx-remote/rsc */}
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
