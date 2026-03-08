'use client'

import React from 'react'
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas'
import type { AudioVisualizerProps } from './types'

export type { AudioVisualizerProps, VisualizerType } from './types'

export const AudioVisualizer: React.FC<AudioVisualizerProps> = props => {
  return <AudioVisualizerCanvas {...props} />
}
