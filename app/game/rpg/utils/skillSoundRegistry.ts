import skillSoundManifestData from '../data/skill-sound-manifest.json'
import type { SkillUsedEntry } from '../types'

export interface SkillSoundManifestEntry {
  skillName: string
  effectKey?: string
  fileName: string
  preset: string
  durationSeconds: number
  promptEn: string
}

const SKILL_SOUND_BASE_PATH = '/game/rpg/sfx/skills'

export const skillSoundManifest = skillSoundManifestData as SkillSoundManifestEntry[]

const skillSoundByName = new Map(skillSoundManifest.map(entry => [entry.skillName, entry]))

const skillSoundByEffectKey = new Map<string, SkillSoundManifestEntry>()
for (const entry of skillSoundManifest) {
  if (entry.effectKey && !skillSoundByEffectKey.has(entry.effectKey)) {
    skillSoundByEffectKey.set(entry.effectKey, entry)
  }
}

const toSkillSoundUrl = (fileName: string) => `${SKILL_SOUND_BASE_PATH}/${fileName}`

export function getSkillSoundUrl(
  skill?: Pick<SkillUsedEntry, 'name' | 'effect_key'> | null
): string | null {
  if (!skill) return null

  const byName = skill.name ? skillSoundByName.get(skill.name) : undefined
  if (byName) {
    return toSkillSoundUrl(byName.fileName)
  }

  const byEffectKey = skill.effect_key ? skillSoundByEffectKey.get(skill.effect_key) : undefined
  if (byEffectKey) {
    return toSkillSoundUrl(byEffectKey.fileName)
  }

  return null
}

export function getAllSkillSoundUrls(): string[] {
  return skillSoundManifest.map(entry => toSkillSoundUrl(entry.fileName))
}
