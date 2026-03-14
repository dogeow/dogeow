import { gameAsset } from '@/lib/helpers/assets'

function addOriginSuffix(fileName: string): string {
  return fileName.replace(/\.([^.]+)$/, '_origin.$1')
}

function resolveRpgAssetUrl(
  baseDir: string,
  fileName?: string | null,
  fallbackId?: number | null,
  fallbackPrefix?: string,
  useOrigin = false
): string {
  if (fileName) {
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      return useOrigin ? addOriginSuffix(fileName) : fileName
    }
    const resolvedName = useOrigin ? addOriginSuffix(fileName) : fileName
    return gameAsset(fileName.startsWith('/') ? resolvedName : `${baseDir}/${resolvedName}`)
  }

  if (fallbackId != null && fallbackPrefix) {
    const suffix = useOrigin ? '_origin' : ''
    return gameAsset(`${baseDir}/${fallbackPrefix}_${fallbackId}${suffix}.png`)
  }

  return ''
}

export function getRpgItemImageUrl(
  icon?: string | null,
  definitionId?: number | null,
  useOrigin = false
): string {
  return resolveRpgAssetUrl('/game/rpg/items', icon, definitionId, 'item', useOrigin)
}

export function getRpgMonsterImageUrl(
  icon?: string | null,
  monsterId?: number | null,
  useOrigin = false
): string {
  return resolveRpgAssetUrl('/game/rpg/monsters', icon, monsterId, 'monster', useOrigin)
}
