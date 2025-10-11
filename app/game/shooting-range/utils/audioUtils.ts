/**
 * 音频播放工具函数
 */

/**
 * 播放音效
 * @param soundPath 音频文件路径
 * @param volume 音量 (0-1)
 * @param playbackRate 播放速度
 * @param maxDuration 最大播放时长（毫秒）
 */
export const playSound = (
  soundPath: string,
  volume: number = 0.2,
  playbackRate: number = 1.0,
  maxDuration?: number
) => {
  try {
    const audio = new Audio(soundPath)
    audio.volume = volume
    audio.playbackRate = playbackRate

    if (maxDuration) {
      setTimeout(() => {
        audio.pause()
        audio.currentTime = 0
      }, maxDuration)
    }

    audio.play().catch(err => console.log('音频播放失败', err))
  } catch (e) {
    console.log('音频初始化失败', e)
  }
}

/**
 * 播放射击音效
 */
export const playShotSound = () => {
  playSound('/sounds/shot.mp3', 0.15, 0.8, 500)
}

/**
 * 播放爆炸音效
 */
export const playExplosionSound = () => {
  playSound('/sounds/explode.mp3', 1, 3, 200)
}

/**
 * 播放击中音效
 */
export const playHitSound = () => {
  playSound('/sounds/explode.mp3', 0.2, 1.0, 800)
}
