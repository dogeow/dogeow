/**
 * 处理播放地址，确保它是完整URL
 */
export const processUrl = (urlStr: string) => {
  try {
    // 检查是否需要添加API前缀
    if (urlStr.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
      const fullUrl = `${baseUrl}${urlStr}`;

      return fullUrl;
    }
    
    // 检查是否已经是完整URL
    const url = new URL(urlStr);
    return url.toString();
  } catch (e) {
    // 如果不是有效URL，假设它是相对路径
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    const fallbackUrl = `${baseUrl}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
    return fallbackUrl;
  }
};

/**
 * 从文件路径中提取歌曲名称
 */
export const extractSongName = (path: string): string => {
  if (!path) return '';
  
  console.log('提取歌曲名，原始路径:', path);
  
  // 从路径中提取文件名
  const fileName = path.split('/').pop() || '';
  
  // 移除扩展名，保留歌曲名
  const songName = fileName.replace(/\.(mp3|wav|ogg|aac|flac|m4a)$/i, '');
  
  return songName;
};

/**
 * 构建音乐播放地址
 */
export const buildHlsUrl = (musicPath: string) => {
  if (!musicPath) return '';
  
  // 直接返回完整 URL
  return processUrl(musicPath);
};

/**
 * 检查文件路径是否支持播放
 */
export const isHlsCompatible = (path: string): boolean => {
  if (!path) return false;
  
  // 支持常见音频格式
  const isAudioFile = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(path);
  
  return isAudioFile;
};

/**
 * 设置音频元素
 */
export const setupHls = (
  audioElement: HTMLAudioElement, 
  source: string,
  onError: (error: string) => void,
  onMediaAttached: () => void = () => {},
  onManifestParsed: () => void = () => {},
) => {
  try {
    // 处理 URL
    const finalSource = processUrl(source);
    console.log('设置音频源:', finalSource);
    
    // 设置音频源
    audioElement.src = finalSource;
    audioElement.preload = 'metadata';
    
    // 添加元数据加载事件监听器
    const handleLoadedMetadata = () => {
      console.log('音频元数据已加载，时长:', audioElement.duration);
      onManifestParsed();
    };
    
    // 添加错误事件监听器
    const handleError = () => {
      const errorMessage = audioElement.error 
        ? `播放错误 (${audioElement.error.code}): ${audioElement.error.message}`
        : '未知播放错误';
      console.error('音频加载失败:', errorMessage);
      onError(errorMessage);
    };
    
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('error', handleError);
    
    // 加载音频
    audioElement.load();
    onMediaAttached();
    
    return {
      hls: null,
      destroy: () => {
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('error', handleError);
      }
    };
  } catch (err) {
    console.error('设置音频源失败:', err);
    onError(`设置音频源失败: ${err}`);
    return {
      hls: null,
      destroy: () => {}
    };
  }
}; 