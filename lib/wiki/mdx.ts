import fs from 'node:fs'
import path from 'node:path'

export type WikiFrontmatter = {
  title: string
  summary?: string
  tags?: string[]
}

export function getWikiContentDir(): string {
  return path.join(process.cwd(), 'content', 'wiki')
}

export function getArticleSlugs(): string[] {
  const dir = getWikiContentDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(f => f.replace(/\.(mdx|md)$/, ''))
}

export async function readArticleSourceBySlug(slug: string): Promise<string> {
  // 先尝试 .mdx，再尝试 .md
  const mdxPath = path.join(getWikiContentDir(), `${slug}.mdx`)
  const mdPath = path.join(getWikiContentDir(), `${slug}.md`)

  if (fs.existsSync(mdxPath)) {
    return fs.readFileSync(mdxPath, 'utf8')
  }

  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, 'utf8')
  }

  throw new Error(`Article not found: ${slug}`)
}
