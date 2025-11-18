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
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace(/\.mdx$/, ''))
}

export async function readArticleSourceBySlug(slug: string): Promise<string> {
  const filePath = path.join(getWikiContentDir(), `${slug}.mdx`)
  const exists = fs.existsSync(filePath)
  if (!exists) {
    throw new Error(`Article not found: ${slug}`)
  }
  return fs.readFileSync(filePath, 'utf8')
}
