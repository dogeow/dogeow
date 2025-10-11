/**
 * 图片处理工具函数
 */

/**
 * 计算保持长宽比的背景图片尺寸
 */
export const getBackgroundSize = (
  containerSize: number,
  size: number,
  imageDimensions: { width: number; height: number }
): string => {
  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    return `${containerSize * size}px ${containerSize * size}px`
  }

  const aspectRatio = imageDimensions.width / imageDimensions.height
  const totalSize = containerSize * size

  // 使用 cover 的逻辑：确保图片完全覆盖拼图区域
  if (aspectRatio > 1) {
    // 宽图：以高度为准，宽度按比例放大
    return `${totalSize * aspectRatio}px ${totalSize}px`
  } else {
    // 高图：以宽度为准，高度按比例放大
    return `${totalSize}px ${totalSize / aspectRatio}px`
  }
}

/**
 * 计算背景位置，确保拼图块显示正确的图片区域
 */
export const getBackgroundPosition = (
  row: number,
  col: number,
  containerSize: number,
  size: number,
  imageDimensions: { width: number; height: number }
): string => {
  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    return `-${col * containerSize}px -${row * containerSize}px`
  }

  const aspectRatio = imageDimensions.width / imageDimensions.height
  const totalSize = containerSize * size

  if (aspectRatio > 1) {
    // 宽图：需要水平居中
    const actualWidth = totalSize * aspectRatio
    const offsetX = (actualWidth - totalSize) / 2
    return `-${col * containerSize + offsetX / size}px -${row * containerSize}px`
  } else {
    // 高图：需要垂直居中
    const actualHeight = totalSize / aspectRatio
    const offsetY = (actualHeight - totalSize) / 2
    return `-${col * containerSize}px -${row * containerSize + offsetY / size}px`
  }
}

/**
 * 加载图片并获取尺寸
 */
export const loadImage = (imageUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    img.src = imageUrl
  })
}
