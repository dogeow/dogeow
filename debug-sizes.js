// 调试脚本：检查不同sizes设置在不同屏幕尺寸下的表现
console.log('=== Tile Sizes Debug ===')

const tiles = [
  { name: '物品管理', colSpan: 3 },
  { name: '文件', colSpan: 2 },
  { name: '工具', colSpan: 2 },
  { name: '实验室', colSpan: 1 },
  { name: '导航', colSpan: 1 },
  { name: '笔记', colSpan: 1 },
  { name: '游戏', colSpan: 1 },
]

const screenSizes = [
  { name: '手机', width: 375 },
  { name: '平板', width: 768 },
  { name: '桌面', width: 1024 },
  { name: '大桌面', width: 1440 },
  { name: '超大桌面', width: 2560 },
]

function calculateExpectedSize(colSpan, screenWidth) {
  if (screenWidth <= 640) {
    return Math.min(screenWidth, 100) // 100vw but capped
  } else if (screenWidth <= 1024) {
    if (colSpan === 3) return 800
    if (colSpan === 2) return 400
    return 300
  } else {
    if (colSpan === 3) return 600
    if (colSpan === 2) return 450
    return 300
  }
}

tiles.forEach(tile => {
  console.log(`\n${tile.name} (colSpan=${tile.colSpan}):`)
  screenSizes.forEach(screen => {
    const expectedSize = calculateExpectedSize(tile.colSpan, screen.width)
    console.log(`  ${screen.name} (${screen.width}px): ${expectedSize}px`)
  })
})

console.log('\n=== 期望结果 ===')
console.log('小tile（游戏等）应该在所有屏幕上都请求300px或更小的图片')
console.log('大tile（物品管理）可以请求更大的图片（600-800px）')
