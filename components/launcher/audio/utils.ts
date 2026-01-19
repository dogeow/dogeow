// 构建音频URL
export function buildAudioUrl(track: string, apiUrl: string) {
  if (track.startsWith('http://') || track.startsWith('https://')) {
    return track
  }

  // 从路径中提取文件名
  const trackPath = track.startsWith('/') ? track.slice(1) : track
  const filename = trackPath.split('/').pop() // 获取文件名部分
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl // 移除尾部斜杠
  return baseUrl + '/api/musics/' + encodeURIComponent(filename)
}

// 检测是否为移动设备
export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  )
}
