'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/helpers'
import type { AudioVisualizerProps, VisualizerType } from './types'
import { drawBarSingle, drawBars, drawBars6 } from './drawBars'
import { drawWave, drawWaveformHistory } from './drawWave'
import { drawSpectrum } from './drawSpectrum'
import { drawParticles, drawSilk } from './drawAmbient'

const MAX_HISTORY_LENGTH = 200

export const AudioVisualizerCanvas: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  type = 'bars6',
  className,
  barCount = 32,
  barWidth = 3,
  barGap = 2,
  barColor = '#3b82f6',
  showGradient = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const prevTypeRef = useRef<VisualizerType>(type)
  const waveformHistoryRef = useRef<number[][]>([])
  const particlesRef = useRef<
    Array<{ x: number; y: number; z: number; prevX: number; prevY: number }>
  >([])
  const silkPointsRef = useRef<
    Array<{
      x: number
      y: number
      len: number
      speed: number
      alpha: number
      hue: number
      vx?: number
      seed?: number
    }>
  >([])
  const spectrumSmoothedRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    if (analyserNode) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount)
    }
  }, [analyserNode])

  useEffect(() => {
    const draw = () => {
      if (!canvasRef.current || !analyserNode || !dataArrayRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const displayWidth = Math.ceil(rect.width)
      const displayHeight = Math.ceil(rect.height)

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr
        canvas.height = displayHeight * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }

      const width = displayWidth
      const height = displayHeight
      const dataArray = dataArrayRef.current

      analyserNode.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)

      if (prevTypeRef.current !== type) {
        ctx.clearRect(0, 0, width, height)
        prevTypeRef.current = type
      }

      switch (type) {
        case 'bars':
          drawBars(ctx, dataArray, width, height, {
            barCount,
            barWidth,
            barGap,
            barColor,
            showGradient,
          })
          break
        case 'bars6':
          drawBars6(ctx, dataArray, width, height)
          break
        case 'barSingle':
          drawBarSingle(ctx, dataArray, width, height)
          break
        case 'spectrum':
          drawSpectrum(ctx, dataArray, width, height, spectrumSmoothedRef)
          break
        case 'waveform':
          drawWaveformHistory(ctx, dataArray, width, height, waveformHistoryRef, MAX_HISTORY_LENGTH)
          break
        case 'particles':
          drawParticles(ctx, dataArray, width, height, particlesRef)
          break
        case 'silk':
          drawSilk(ctx, dataArray, width, height, silkPointsRef, canvasRef.current)
          break
        default:
          drawWave(ctx, dataArray, width, height)
          break
      }

      if (isPlaying && analyserNode) {
        animationFrameRef.current = requestAnimationFrame(draw)
      }
    }

    if (isPlaying && analyserNode) {
      draw()
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyserNode, barColor, barCount, barGap, barWidth, isPlaying, showGradient, type])

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
