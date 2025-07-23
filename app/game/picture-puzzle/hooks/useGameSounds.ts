import { useCallback, useRef } from 'react'

export function useGameSounds() {
  const audioContextRef = useRef<AudioContext | null>(null)

  // 初始化音频上下文
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch (error) {
        console.warn('Audio context not supported:', error)
      }
    }
  }, [])

  // 播放移动音效（使用 Web Audio API 生成简单音效）
  const playMoveSound = useCallback(() => {
    initAudioContext()
    if (!audioContextRef.current) return

    try {
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch (error) {
      console.warn('Failed to play move sound:', error)
    }
  }, [initAudioContext])

  // 播放完成音效
  const playCompleteSound = useCallback(() => {
    initAudioContext()
    if (!audioContextRef.current) return

    try {
      const ctx = audioContextRef.current

      // 播放一个简单的成功音效序列
      const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15)

        gainNode.gain.setValueAtTime(0, ctx.currentTime + index * 0.15)
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + index * 0.15 + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.15 + 0.3)

        oscillator.start(ctx.currentTime + index * 0.15)
        oscillator.stop(ctx.currentTime + index * 0.15 + 0.3)
      })
    } catch (error) {
      console.warn('Failed to play complete sound:', error)
    }
  }, [initAudioContext])

  return {
    playMoveSound,
    playCompleteSound,
  }
}
