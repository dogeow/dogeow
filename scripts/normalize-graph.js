/* eslint-disable no-console */
// 规范化 graph.json，自动生成缺失的 id 和 slug
const fs = require('node:fs')
const path = require('node:path')

function normalizeSlug(title) {
  const normalized = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 保留中文、字母、数字、连字符
    .replace(/\s+/g, '-') // 空格转连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .trim()
  // 如果规范化后为空，则使用原始 title
  return normalized || title
}

function normalizeGraph(inputPath, outputPath = null) {
  const filePath = path.resolve(inputPath)
  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let changed = false

  // 先规范化所有节点
  data.nodes = data.nodes.map(node => {
    // 自动生成缺失的字段
    if (!node.id || node.id === '') {
      node.id = normalizeSlug(node.title)
      changed = true
    }
    if (!node.slug || node.slug === '') {
      node.slug = normalizeSlug(node.title)
      changed = true
    }
    if (!node.tags) {
      node.tags = []
      changed = true
    }
    if (!node.summary) {
      node.summary = ''
      changed = true
    }

    return node
  })

  // 创建 title -> id 的映射表
  const titleToIdMap = new Map()
  data.nodes.forEach(node => {
    titleToIdMap.set(node.title, node.id)
  })

  // 规范化链接：将 title 转换为 id
  if (data.links) {
    data.links = data.links.map(link => {
      let source = link.source
      let target = link.target

      // 如果 source/target 是字符串，尝试从 title 映射到 id
      if (typeof source === 'string') {
        const mappedId = titleToIdMap.get(source)
        if (mappedId && mappedId !== source) {
          source = mappedId
          changed = true
        }
      }
      if (typeof target === 'string') {
        const mappedId = titleToIdMap.get(target)
        if (mappedId && mappedId !== target) {
          target = mappedId
          changed = true
        }
      }

      return {
        ...link,
        source,
        target,
      }
    })
  }

  if (changed) {
    const outPath = outputPath || filePath
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8')
    console.log(`✅ 已规范化并保存到: ${outPath}`)
    console.log(`📊 节点数量: ${data.nodes.length}`)
    console.log(`🔗 连接数量: ${data.links.length}`)
  } else {
    console.log('✅ 数据已经是规范化的，无需修改')
  }

  return data
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2)
  const inputPath = args[0] || path.join(process.cwd(), 'content', 'wiki', 'graph.json')
  const outputPath = args[1] || null

  normalizeGraph(inputPath, outputPath)
}

module.exports = { normalizeGraph, normalizeSlug }
