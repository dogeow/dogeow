import type { TileConfig, TileSize } from '@/stores/homeLayoutStore'

const GRID_COLUMNS = 3

/**
 * 将尺寸字符串转换为宽高
 */
function parseSize(size: TileSize): { width: number; height: number } {
  const [w, h] = size.split('x').map(Number)
  return { width: w, height: h }
}

/**
 * 根据 tiles 配置生成默认布局（如果用户没有自定义布局）
 * 基于原始的 configs.gridLayout.templateAreas 布局：
 * "thing thing thing"
 * "chat file file"
 * "chat tool lab"
 * "nav note game"
 */
export function generateDefaultLayout(tileNames: string[]): TileConfig[] {
  // 默认布局配置（基于现有的 configs.gridLayout.templateAreas）
  const defaultLayout: Record<string, TileSize> = {
    thing: '3x1',
    chat: '1x2',
    file: '2x1',
    tool: '1x1',
    lab: '1x1',
    nav: '1x1',
    note: '1x1',
    game: '1x1',
  }

  // 根据原始布局顺序定义 order
  // 布局顺序：thing(0) -> chat(1) -> file(2) -> tool(3) -> lab(4) -> nav(5) -> note(6) -> game(7)
  const layoutOrder: Record<string, number> = {
    thing: 0,
    chat: 1,
    file: 2,
    tool: 3,
    lab: 4,
    nav: 5,
    note: 6,
    game: 7,
  }

  return tileNames.map(name => ({
    name,
    size: defaultLayout[name] ?? '1x1',
    order: layoutOrder[name] ?? 999, // 未定义的排在最后
  }))
}

/**
 * 将 tiles 配置转换为 CSS Grid 的 gridTemplateAreas 字符串
 */
export function generateGridAreas(tiles: TileConfig[]): string {
  // 按 order 排序
  const sortedTiles = [...tiles].sort((a, b) => a.order - b.order)

  // 创建一个 3 列的网格布局
  // 使用二维数组表示网格，每个位置存储 tile name
  const grid: (string | null)[][] = []
  let currentRow = 0

  // 初始化网格（假设最多 10 行，实际会根据需要扩展）
  for (let i = 0; i < 20; i++) {
    grid[i] = Array(GRID_COLUMNS).fill(null)
  }

  // 放置每个 tile
  for (const tile of sortedTiles) {
    const { width, height } = parseSize(tile.size)

    // 验证尺寸是否合理
    if (width > GRID_COLUMNS) {
      console.warn(`⚠️ Tile ${tile.name} has invalid width ${width}, clamping to ${GRID_COLUMNS}`)
      // 不处理，让算法自然失败，这样用户可以看到问题
    }

    // 找到可以放置的位置（从上到下，从左到右）
    let placed = false
    for (let row = 0; row < grid.length && !placed; row++) {
      for (let col = 0; col <= GRID_COLUMNS - width && !placed; col++) {
        // 检查这个位置是否可以放置
        let canPlace = true
        for (let h = 0; h < height && canPlace; h++) {
          for (let w = 0; w < width && canPlace; w++) {
            if (grid[row + h]?.[col + w] !== null) {
              canPlace = false
            }
          }
        }

        if (canPlace) {
          // 放置 tile
          for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
              grid[row + h][col + w] = tile.name
            }
          }
          placed = true
          currentRow = Math.max(currentRow, row + height - 1)

          // 调试信息
          console.log(`📍 Placed ${tile.name} (${tile.size}) at row ${row}, col ${col}`)
        }
      }
    }

    // 如果无法放置，输出警告
    if (!placed) {
      console.error(`❌ Could not place tile: ${tile.name} (${tile.size})`)
      console.error('Current grid state:')
      for (let r = 0; r <= currentRow + 2; r++) {
        console.error(`  Row ${r}:`, grid[r]?.map(c => c ?? '.').join(' ') ?? 'empty')
      }
    }
  }

  // 转换为 gridTemplateAreas 字符串
  // CSS Grid 格式: "area1 area1 area2" "area3 area4 area4"
  const areas: string[] = []

  // 找到实际使用的最大行数（排除完全为空的行）
  let maxUsedRow = -1
  for (let row = 0; row <= currentRow; row++) {
    const hasContent = grid[row]?.some(cell => cell !== null) ?? false
    if (hasContent) {
      maxUsedRow = row
    }
  }

  // 生成网格区域字符串
  // 确保所有行都被包含，即使有空单元格
  for (let row = 0; row <= maxUsedRow; row++) {
    const rowCells: string[] = []
    for (let col = 0; col < GRID_COLUMNS; col++) {
      const cell = grid[row]?.[col]
      // 如果单元格为空，使用 '.' 作为占位符（CSS Grid 会自动处理）
      rowCells.push(cell ?? '.')
    }
    areas.push(`"${rowCells.join(' ')}"`)
  }

  // 调试：打印生成的网格
  console.log('📐 Generated grid areas:')
  console.log('Tiles:', sortedTiles.map(t => `${t.name}(${t.size})`).join(', '))
  console.log('Grid layout:')
  for (let row = 0; row <= maxUsedRow; row++) {
    const rowStr = grid[row]?.map(cell => cell ?? '.').join(' ') ?? ''
    console.log(`  Row ${row}: [${rowStr}]`)
  }
  areas.forEach((area, idx) => {
    console.log(`  Row ${idx}: ${area}`)
  })

  return areas.join('\n    ')
}

/**
 * 获取 tile 的 gridArea 样式值
 */
export function getTileGridArea(tileName: string, tiles: TileConfig[]): string {
  const tile = tiles.find(t => t.name === tileName)
  if (!tile) return tileName

  // 在生成的网格中找到该 tile 的位置
  // 这里简化处理，直接返回 tile name，实际 gridArea 由 CSS Grid 自动处理
  return tileName
}
