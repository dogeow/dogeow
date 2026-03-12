'use client'

export type VisualizerType =
  | 'bars'
  | 'waveform'
  | 'bars6'
  | 'barSingle'
  | 'spectrum'
  | 'particles'
  | 'silk'

export interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null
  isPlaying: boolean
  type?: VisualizerType
  className?: string
  barCount?: number
  barWidth?: number
  barGap?: number
  barColor?: string
  showGradient?: boolean
  fitWidth?: boolean
  barFillRatio?: number
}
