interface ToggleMuteWithMobileSupportOptions {
  audio: HTMLAudioElement
  isMuted: boolean
  volume: number
  isMobile: boolean
  setIsMuted: (isMuted: boolean) => void
}

// 专门的静音切换函数 - 确保手机端兼容性
export function toggleMuteWithMobileSupport({
  audio,
  isMuted,
  volume,
  isMobile,
  setIsMuted,
}: ToggleMuteWithMobileSupportOptions) {
  const newMutedState = !isMuted

  // 更新状态
  setIsMuted(newMutedState)

  // 同时设置volume和muted属性，确保在所有设备上都能正常工作
  if (newMutedState) {
    audio.volume = 0
    audio.muted = true

    // 手机端额外处理：暂停播放以确保静音效果
    if (isMobile && !audio.paused) {
      audio.pause()
      // 记录暂停状态，稍后恢复
      audio.dataset.wasPlaying = 'true'
    }
  } else {
    audio.muted = false
    audio.volume = volume

    // 手机端额外处理：如果之前是播放状态，恢复播放
    if (isMobile && audio.dataset.wasPlaying === 'true') {
      // 保存当前播放时间，避免进度重置
      const currentTime = audio.currentTime

      // 恢复播放，但保持当前进度
      audio
        .play()
        .then(() => {
          // 确保进度没有被重置
          if (Math.abs(audio.currentTime - currentTime) > 1) {
            audio.currentTime = currentTime
          }
        })
        .catch(console.error)

      audio.dataset.wasPlaying = 'false'
    }
  }

  // 静音切换完成
}
