/* eslint-disable no-console */
// 生成大规模随机图用于性能测试
// 写入 dogeow/content/wiki/graph.json
const fs = require('node:fs')
const path = require('node:path')

function generateGraph(nodeCount = 3000, avgDegree = 3) {
  const nodes = []
  const links = []

  // 基础节点，便于眼睛识别
  const baseTopics = [
    { id: 'nextjs', title: 'Next.js', slug: 'nextjs' },
    { id: 'mdx', title: 'MDX', slug: 'mdx' },
    { id: 'force-graph', title: 'force-graph 2D', slug: 'force-graph' },
    { id: 'wiki-design', title: 'Wiki 设计', slug: 'wiki-design' },
  ]
  for (const t of baseTopics) {
    nodes.push({ id: t.id, title: t.title, slug: t.slug, tags: [], summary: '' })
  }

  // 生成剩余节点：n-开头，简短标题减少绘制负担
  for (let i = 0; i < nodeCount - baseTopics.length; i++) {
    const id = `n${i}`
    nodes.push({
      id,
      title: `N${i}`,
      slug: `n${i}`,
      tags:
        i % 5 === 0
          ? ['g0']
          : i % 5 === 1
            ? ['g1']
            : i % 5 === 2
              ? ['g2']
              : i % 5 === 3
                ? ['g3']
                : ['g4'],
      summary: '',
    })
  }

  // Backbone：让每个节点至少连接到一个较小索引，保证整体连通
  for (let i = 1; i < nodes.length; i++) {
    const j = Math.floor(Math.random() * i)
    links.push({ source: nodes[i].id, target: nodes[j].id, type: 'rand' })
  }

  // 额外随机边：近似 avgDegree
  const extraEdges = Math.floor((nodes.length * avgDegree - links.length) / 2)
  const n = nodes.length
  for (let k = 0; k < extraEdges; k++) {
    const a = Math.floor(Math.random() * n)
    let b = Math.floor(Math.random() * n)
    if (a === b) b = (b + 1) % n
    links.push({ source: nodes[a].id, target: nodes[b].id, type: 'rand' })
  }

  return { nodes, links }
}

function main() {
  const outPath = path.join(process.cwd(), 'content', 'wiki', 'graph.json')
  const graph = generateGraph(3000, 3)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2), 'utf8')
  const info = {
    nodes: graph.nodes.length,
    links: graph.links.length,
    outPath,
  }
  console.log(JSON.stringify(info, null, 2))
}

main()
