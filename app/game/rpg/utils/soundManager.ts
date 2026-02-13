// 游戏音效管理器

type SoundEffect =
  | 'combat_start'
  | 'combat_hit'
  | 'combat_victory'
  | 'combat_defeat'
  | 'level_up'
  | 'item_drop'
  | 'skill_use'
  | 'button_click'
  | 'equip'
  | 'gold'

class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private volume: number = 0.3
  // 单例 AudioContext - 避免每次播放音效都创建新实例
  private audioContext: AudioContext | null = null

  constructor() {
    this.loadSounds()
    this.loadSettings()
  }

  // 获取或创建 AudioContext 单例
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('SoundManager: 无法创建 AudioContext', error)
        return null
      }
    }

    // 如果 AudioContext 被暂停（浏览器自动暂停策略），尝试恢复
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }

    return this.audioContext
  }

  private loadSounds() {
    // 使用浏览器内置的 Web Audio API 或免费音效库
    const soundUrls: Partial<Record<SoundEffect, string>> = {
      // 可以使用免费音效资源，如：
      // - https://freesound.org/
      // - https://www.zapsplat.com/
      // - 或使用 Base64 编码的简短音效
    }

    // 预加载音效（这里使用空音频，实际使用时替换）
    Object.entries(soundUrls).forEach(([key, url]) => {
      if (url) {
        const audio = new Audio(url)
        audio.volume = this.volume
        this.sounds.set(key as SoundEffect, audio)
      }
    })
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rpg-sound-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.enabled = settings.enabled ?? true
        this.volume = settings.volume ?? 0.3
      }
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'rpg-sound-settings',
        JSON.stringify({
          enabled: this.enabled,
          volume: this.volume,
        })
      )
    }
  }

  play(effect: SoundEffect) {
    if (!this.enabled || typeof window === 'undefined') return

    // 使用 Web Audio API 生成简单音效
    this.playGeneratedSound(effect)
  }

  private playGeneratedSound(effect: SoundEffect) {
    const audioContext = this.getAudioContext()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    gainNode.gain.value = this.volume * 0.1

    switch (effect) {
      case 'combat_start':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break

      case 'combat_hit':
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.05)
        break

      case 'combat_victory':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
        break

      case 'combat_defeat':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        break

      case 'level_up':
        const now = audioContext.currentTime
        oscillator.frequency.setValueAtTime(523, now) // C5
        oscillator.frequency.setValueAtTime(659, now + 0.1) // E5
        oscillator.frequency.setValueAtTime(784, now + 0.2) // G5
        oscillator.frequency.setValueAtTime(1047, now + 0.3) // C6
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        oscillator.start(now)
        oscillator.stop(now + 0.5)
        break

      case 'item_drop':
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
        break

      case 'skill_use':
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
        break

      case 'button_click':
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.03)
        break

      case 'equip':
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
        break

      case 'gold':
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.05)
        oscillator.frequency.setValueAtTime(1800, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
        break
    }
  }

  toggle() {
    this.enabled = !this.enabled
    this.saveSettings()
    return this.enabled
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(sound => {
      sound.volume = this.volume
    })
    this.saveSettings()
  }

  isEnabled() {
    return this.enabled
  }

  getVolume() {
    return this.volume
  }
}

// 单例导出
export const soundManager = new SoundManager()
