import Hls from 'hls.js';

/**
 * 处理播放地址，确保它是完整URL
 */
export const processUrl = (urlStr: string) => {
  console.log('处理URL:', urlStr);
  console.log('环境变量:', {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL, 
    API_URL: process.env.NEXT_PUBLIC_API_URL
  });

  try {
    // 检查是否需要添加API前缀
    if (urlStr.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
      const fullUrl = `${baseUrl}${urlStr}`;
      console.log('处理后的URL:', fullUrl);
      return fullUrl;
    }
    
    // 检查是否已经是完整URL
    const url = new URL(urlStr);
    console.log('已经是完整URL:', url.toString());
    return url.toString();
  } catch (e) {
    // 如果不是有效URL，假设它是相对路径
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    const fallbackUrl = `${baseUrl}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
    console.log('处理为回退URL:', fallbackUrl);
    return fallbackUrl;
  }
};

/**
 * 从文件路径中提取歌曲名称
 */
export const extractSongName = (path: string): string => {
  if (!path) return '';
  
  console.log('提取歌曲名，原始路径:', path);
  
  // 对于hls-converter.php路径，直接从参数提取
  if (path.includes('hls-converter.php?path=')) {
    const songName = decodeURIComponent(path.split('hls-converter.php?path=')[1]);
    console.log('从hls-converter URL提取的歌曲名:', songName);
    return songName;
  }
  
  // 对于HLS格式，尝试从目录结构提取
  if (path.includes('/hls/')) {
    // 匹配/hls/后的目录名
    const match = path.match(/\/hls\/([^\/]+)/);
    if (match && match[1]) {
      const dirName = match[1];
      console.log('从HLS目录结构提取的歌曲名:', dirName);
      return dirName;
    }
  }
  
  // 从路径中提取文件名
  const fileName = path.split('/').pop() || '';
  
  // 移除扩展名，保留歌曲名
  const songName = fileName.replace(/\.(mp3|wav|ogg|aac|flac|m4a|m3u8|ts)$/i, '');
  console.log('从文件名提取的歌曲名:', songName);
  
  return songName;
};

/**
 * 构建HLS播放地址
 */
export const buildHlsUrl = (musicPath: string) => {
  if (!musicPath) return '';
  
  console.log('构建HLS URL，原始路径:', musicPath);
  console.log('环境变量:', {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL, 
    API_URL: process.env.NEXT_PUBLIC_API_URL
  });
  
  // 检查是否已经是HLS路径或已存在hls-converter.php?path=的情况
  if (musicPath.includes('hls-converter.php?path=') || musicPath.includes('ts-handler.php?path=')) {
    console.log('检测到已经是hls-converter或ts-handler路径，直接使用');
    return musicPath;
  }
  
  // 从文件路径中提取歌曲名
  const songName = extractSongName(musicPath);
  console.log('提取的歌曲名:', songName);
  
  if (!songName) {
    console.error('无法从路径中提取歌曲名:', musicPath);
    return '';
  }
  
  // 使用固定的API基础URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  
  // 使用hls-converter.php构建URL，与/tool/music页面一致
  // 去除'/api'后缀，因为hls-converter.php直接位于根目录
  const baseUrl = apiBaseUrl.replace(/\/api$/, '');
  
  // 对歌曲名进行编码
  const encodedPath = encodeURIComponent(songName);
  
  // 检测是否为iOS设备
  const isiOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  
  // 构建hls-converter.php URL，对iOS设备特殊处理
  let converterUrl = `${baseUrl}/hls-converter.php?path=${encodedPath}`;
  
  // 添加iOS标识，以便后端脚本可以对iOS设备做特殊处理
  if (isiOS) {
    converterUrl += '&device=ios';
  }
  
  // 添加时间戳避免缓存问题
  converterUrl += `&_t=${Date.now()}`;
  
  console.log('使用hls-converter.php构建的URL:', converterUrl);
  return converterUrl;
};

/**
 * 检查文件路径是否支持HLS播放
 */
export const isHlsCompatible = (path: string): boolean => {
  if (!path) return false;
  
  // 检查路径是否包含HLS相关标记
  const isHlsPath = path.includes('.m3u8') || path.includes('/hls/') || path.includes('.ts');
  
  // 支持常见音频格式转HLS播放
  const isAudioFile = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(path);
  
  return isHlsPath || isAudioFile;
};

/**
 * 检测是否为iOS设备
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * 检测是否为Safari浏览器
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1;
};

/**
 * 创建HLS播放器并绑定到audio元素
 */
export const setupHls = (
  audioElement: HTMLAudioElement, 
  source: string,
  onError: (error: string) => void,
  onMediaAttached: () => void = () => {},
  onManifestParsed: () => void = () => {},
) => {
  let hls: Hls | null = null;
  
  // 清理旧的HLS实例
  const destroyHls = () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  };
  
  // 为确保iOS的兼容性，确保source已经是hls-converter.php格式
  let finalSource = source;
  if (source.startsWith('/') && !source.includes('hls-converter.php')) {
    // 对于相对路径，使用hls-converter.php处理
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    const baseUrl = apiBaseUrl.replace(/\/api$/, '');
    const songName = extractSongName(source);
    const encodedPath = encodeURIComponent(songName);
    
    // 使用hls-converter.php
    finalSource = `${baseUrl}/hls-converter.php?path=${encodedPath}`;
    console.log('转换为hls-converter URL:', finalSource);
  }
  
  console.log('设置HLS播放器，源地址:', finalSource);
  
  // 检测iOS设备
  const isiOSDevice = isIOS();
  const isSafariBrowser = isSafari();
  console.log('设备检测:', { iOS: isiOSDevice, Safari: isSafariBrowser });
  
  // 如果是iOS设备，直接使用原生HLS支持
  if (isiOSDevice || isSafariBrowser || audioElement.canPlayType('application/vnd.apple.mpegurl')) {
    console.log('使用iOS/Safari原生HLS播放');
    try {
      // 确保使用https，iOS通常需要https
      if (finalSource.startsWith('http:') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        finalSource = finalSource.replace('http:', 'https:');
        console.log('转换为HTTPS:', finalSource);
      }
      
      // 添加时间戳参数避免缓存问题
      const timestamp = new Date().getTime();
      finalSource = finalSource.includes('?') 
        ? `${finalSource}&_t=${timestamp}` 
        : `${finalSource}?_t=${timestamp}`;
      
      console.log('原生HLS: 设置音频源:', finalSource);
      audioElement.src = finalSource;
      
      // 预加载设置
      audioElement.preload = 'auto';
      
      // iOS需要设置这些属性以允许播放
      audioElement.setAttribute('playsinline', 'true');
      audioElement.setAttribute('webkit-playsinline', 'true');
      
      // 添加loadedmetadata事件处理
      audioElement.addEventListener('loadedmetadata', () => {
        console.log('原生HLS: 元数据已加载');
        onManifestParsed();
      });
      
      // 监听错误
      audioElement.addEventListener('error', (e) => {
        const errorDetails = audioElement.error 
          ? `代码: ${audioElement.error.code}, 消息: ${audioElement.error.message}` 
          : '未知错误';
        console.error('原生HLS播放失败:', errorDetails);
        onError(`iOS HLS播放失败: ${errorDetails}`);
      });
      
      return {
        hls: null,
        destroy: () => {
          audioElement.removeEventListener('loadedmetadata', onManifestParsed);
          audioElement.src = '';
        }
      };
    } catch (err) {
      console.error('iOS HLS播放设置失败:', err);
      onError(`iOS HLS播放设置失败: ${err}`);
      return {
        hls: null,
        destroy: () => {}
      };
    }
  } else if (Hls.isSupported()) {
    // 非iOS设备使用hls.js
    // 创建新的HLS实例
    hls = new Hls({
      debug: true, // 开启调试以便排查问题
      enableWorker: true,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false;
        xhr.setRequestHeader('Origin', typeof window !== 'undefined' ? window.location.origin : '');
        // 为m3u8文件添加Accept头
        xhr.setRequestHeader('Accept', 'application/vnd.apple.mpegurl');
      },
      manifestLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 3,
    });
    
    // 添加事件监听
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('HLS: 媒体已附加到音频元素');
      try {
        console.log('HLS: 最终加载的源:', finalSource);
        hls?.loadSource(finalSource);
        onMediaAttached();
      } catch (err) {
        console.error('HLS: 加载源失败:', err);
        onError(`HLS加载失败: ${err}`);
      }
    });
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('HLS: 清单已解析');
      onManifestParsed();
    });
    
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.warn('HLS: 错误:', data);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('HLS: 网络错误，尝试恢复...');
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('HLS: 媒体错误，尝试恢复...');
            hls?.recoverMediaError();
            break;
          default:
            console.error('HLS: 致命错误，无法恢复:', data);
            destroyHls();
            onError(`HLS播放错误: ${data.details || '未知错误'}`);
            break;
        }
      }
    });
    
    // 附加到音频元素
    try {
      hls.attachMedia(audioElement);
    } catch (err) {
      console.error('HLS: 附加媒体失败:', err);
      onError(`HLS附加失败: ${err}`);
      destroyHls();
    }
    
    return {
      hls,
      destroy: destroyHls
    };
  } else {
    onError('当前浏览器不支持HLS播放');
    return {
      hls: null,
      destroy: () => {}
    };
  }
}; 