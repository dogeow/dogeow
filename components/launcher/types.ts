import { MusicTrack, PlayMode } from '@/stores/musicStore'

export type DisplayMode = 'music' | 'apps' | 'settings'

// 播放控制按钮组件
export interface PlayerControlButtonProps {
  onClick: () => void
  disabled?: boolean
  title: string
  icon: React.ReactNode
  className?: string
}

// 音乐播放器组件的属性接口
export interface MusicPlayerProps {
  isPlaying: boolean
  audioError: string | null
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  availableTracks: MusicTrack[]
  currentTrack: string
  playMode: PlayMode
  analyserNode?: AnalyserNode | null
  toggleMute: () => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
  togglePlay: () => void
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getCurrentTrackName: () => string | undefined
  formatTime: (time: number) => string
  toggleDisplayMode: (mode: DisplayMode) => void
  onTrackSelect: (trackPath: string) => void
  onTogglePlayMode: () => void
}

export interface SearchBarProps {
  isVisible: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  onSearch: (e: React.FormEvent, keepSearchOpen: boolean) => void
  onToggleSearch: () => void
  currentApp?: string
}
