export type PresetThemeColor = {
  id: string
  nameKey: string
  primary: string
  color: string
}

export const PRESET_THEME_COLORS: ReadonlyArray<PresetThemeColor> = [
  { id: 'overwatch', nameKey: 'theme.overwatch', primary: 'hsl(35 97% 55%)', color: '#fc9d1c' },
  { id: 'minecraft', nameKey: 'theme.minecraft', primary: 'hsl(101 50% 43%)', color: '#5d9c32' },
  { id: 'zelda', nameKey: 'theme.zelda', primary: 'hsl(41 38% 56%)', color: '#b99f65' },
]
