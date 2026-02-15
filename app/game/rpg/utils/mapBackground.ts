import type { MapDefinition } from '../types'

const BG_BASE = '/game/rpg/bg'

/** 按幕(act)的渐变背景，图片加载失败或未配置时使用 */
const ACT_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(135deg, #2d5016 0%, #1a2f0d 50%, #0d1a08 100%)',
  2: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 50%, #0d0d0d 100%)',
  3: 'linear-gradient(135deg, #8b2500 0%, #5c1800 50%, #2d0c00 100%)',
  4: 'linear-gradient(135deg, #1a0a2e 0%, #0d0518 50%, #05020a 100%)',
  5: 'linear-gradient(135deg, #1e3a5f 0%, #0f1d30 50%, #050a14 100%)',
  6: 'linear-gradient(135deg, #3d2c6b 0%, #1f1640 50%, #0d0a1a 100%)',
  7: 'linear-gradient(135deg, #2c4a6b 0%, #1a2d42 50%, #0a1521 100%)',
  8: 'linear-gradient(135deg, #1a0a1a 0%, #2d0a2d 50%, #0d030d 100%)',
}

function getActGradient(act: number): string {
  return ACT_GRADIENTS[act] ?? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
}

/**
 * 解析地图背景图 URL。后端可能返回文件名（如 map_1.jpg）或完整 URL。
 * @param useOrigin 为 true 时使用原图文件名（如 map_32.jpg → map_32_origin.jpg），用于战斗等场景
 */
export function getMapBackgroundUrl(map: MapDefinition | null, useOrigin = false): string | null {
  if (!map?.background) return null
  const bg = map.background.trim()
  if (bg.startsWith('http://') || bg.startsWith('https://')) return bg
  const filename = useOrigin && bg.includes('.') ? bg.replace(/\.([^.]+)$/, '_origin.$1') : bg
  return `${BG_BASE}/${filename}`
}

export type MapBackgroundStyleOptions = {
  /** 为 true 时使用原图（如 map_32_origin.jpg），用于战斗场景 */
  useOrigin?: boolean
  /** 为 true 时用 cover 填满容器（无左右空隙），保持比例不拉伸；默认 contain 完整显示 */
  fill?: boolean
}

/**
 * 返回用于 style.background 的对象：有图时图片在上、渐变为底衬，无图或图片加载失败时只显示渐变。
 * 默认地图图片 contain（完整显示、1:1 比例不裁剪）；fill 为 true 时 cover 填满无空隙。
 */
export function getMapBackgroundStyle(
  map: MapDefinition | null,
  options?: MapBackgroundStyleOptions
): React.CSSProperties {
  const useOrigin = options?.useOrigin ?? false
  const fill = options?.fill ?? false
  const gradient = getActGradient(map?.act ?? 1)
  const imageUrl = getMapBackgroundUrl(map, useOrigin)
  const size = imageUrl ? (fill ? 'cover' : 'contain') : 'cover'
  return {
    backgroundImage: imageUrl ? `url(${imageUrl}), ${gradient}` : gradient,
    backgroundSize: size,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}
