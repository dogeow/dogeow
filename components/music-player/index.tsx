'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import HLSMusicPlayer from './HLSMusicPlayer';
import MusicList, { MusicItem } from './MusicList';
import { useMusicStore } from '@/stores/musicStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

// 加载音乐列表的 fetcher 函数
const fetcher = (url: string) => 
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': typeof window !== 'undefined' ? window.location.origin : ''
    }
  }).then(res => res.json());

export default function MusicPlayerPage() {
  // 从状态管理中获取当前音乐和音量
  const { currentTrack, setCurrentTrack, volume } = useMusicStore();
  
  // 本地状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<MusicItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMusics, setFilteredMusics] = useState<MusicItem[]>([]);
  
  // 从 API 获取音乐列表
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/music/hls`,
    fetcher
  );

  // 音频元素ref预创建
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 在组件挂载时创建audio元素
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window !== 'undefined') {
      // 创建audio元素并添加到DOM中以确保它完全初始化
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = "metadata";
        // 可以考虑将它隐藏并添加到DOM中以确保更好的兼容性
        document.body.appendChild(audioRef.current);
        
        console.log('音频元素已创建和初始化');
      }
    }
    
    // 组件卸载时清理
    return () => {
      if (audioRef.current && document.body.contains(audioRef.current)) {
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
        console.log('音频元素已移除');
      }
    };
  }, []);

  // 处理音乐数据
  useEffect(() => {
    if (data) {
      // 确保音乐列表有正确的格式
      const musicList: MusicItem[] = data.map((item: any) => ({
        id: item.id || item.path,
        name: item.name || extractFilename(item.path),
        artist: item.artist || '',
        path: item.path,
        duration: item.duration || 0,
        coverUrl: item.coverUrl || '',
      }));
      
      setFilteredMusics(musicList);
      
      // 如果有当前曲目，找到对应的音乐项
      if (currentTrack) {
        const current = musicList.find(item => item.path === currentTrack);
        if (current) {
          setCurrentMusic(current);
        }
      }
    }
  }, [data, currentTrack]);

  // 过滤搜索结果
  useEffect(() => {
    if (!data) return;
    
    if (!searchTerm.trim()) {
      setFilteredMusics(data);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = data.filter((item: any) => {
      const name = (item.name || extractFilename(item.path)).toLowerCase();
      const artist = (item.artist || '').toLowerCase();
      return name.includes(term) || artist.includes(term);
    });
    
    setFilteredMusics(filtered);
  }, [searchTerm, data]);

  // 选择音乐
  const handleSelectMusic = useCallback((music: MusicItem) => {
    setCurrentMusic(music);
    setCurrentTrack(music.path);
    setIsPlaying(true);
  }, [setCurrentTrack]);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 下一首
  const playNext = useCallback(() => {
    if (!filteredMusics.length || !currentMusic) return;
    
    const currentIndex = filteredMusics.findIndex(m => m.path === currentMusic.path);
    const nextIndex = (currentIndex + 1) % filteredMusics.length;
    handleSelectMusic(filteredMusics[nextIndex]);
  }, [filteredMusics, currentMusic, handleSelectMusic]);

  // 上一首
  const playPrev = useCallback(() => {
    if (!filteredMusics.length || !currentMusic) return;
    
    const currentIndex = filteredMusics.findIndex(m => m.path === currentMusic.path);
    const prevIndex = (currentIndex - 1 + filteredMusics.length) % filteredMusics.length;
    handleSelectMusic(filteredMusics[prevIndex]);
  }, [filteredMusics, currentMusic, handleSelectMusic]);

  // 从文件路径提取文件名
  const extractFilename = (path: string) => {
    if (!path) return '未知歌曲';
    const filename = path.split('/').pop() || '';
    // 移除扩展名并替换下划线和连字符为空格
    return filename
      .replace(/\.(mp3|wav|m4a|m3u8|ts)$/, '')
      .replace(/[_-]/g, ' ');
  };

  // 从文件路径提取目录名
  const getDirectoryFromPath = (path: string) => {
    // 查找格式为 /musics/hls/目录名/, /music/hls/目录名/ 的路径
    const match = path.match(/\/(?:music|musics)\/hls\/([^\/]+)/);
    if (match && match[1]) {
      // 确保对目录名进行正确编码处理
      let songDir = match[1];
      
      // 先解码以防止双重编码
      try {
        songDir = decodeURIComponent(songDir);
      } catch (e) {
        console.warn('解码失败，使用原始路径:', songDir);
      }
      
      console.log('提取歌曲目录:', songDir);
      return songDir;
    }
    
    // 如果没有找到匹配的模式，使用路径的上一级目录名
    const parts = path.split('/');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    // 如果都无法提取，返回原始路径
    console.log('无法提取目录，使用原路径:', path);
    return path;
  };
  
  // 构建HLS播放地址
  const buildHlsUrl = (music: MusicItem) => {
    if (!music) return '';
    
    // 使用固定的API基础URL，避免环境变量未加载的问题
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    // 去除'/api'后缀，因为hls-converter.php直接位于根目录
    const baseUrl = apiBaseUrl.replace(/\/api$/, '');
    const songDir = getDirectoryFromPath(music.path);
    
    // 确保路径正确编码
    const encodedPath = encodeURIComponent(songDir);
    
    const fullUrl = `${baseUrl}/hls-converter.php?path=${encodedPath}`;
    console.log('构建HLS播放地址:', {
      apiBaseUrl,
      baseUrl,
      songDir,
      encodedPath,
      fullUrl
    });
    
    return fullUrl;
  };

  return (
    <div className="container mx-auto py-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">HLS 音乐播放器</h1>
      <p className="text-sm text-muted-foreground">全平台支持的 HLS 流媒体音乐播放器，支持 PC、安卓和 iOS</p>
      
      {error && (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          加载音乐列表失败：{error.message}
        </div>
      )}
      
      {/* 搜索框 */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="搜索音乐..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="player">播放器</TabsTrigger>
          <TabsTrigger value="playlist">播放列表</TabsTrigger>
        </TabsList>
        
        <TabsContent value="player" className="pt-4">
          {currentMusic ? (
            <HLSMusicPlayer
              src={buildHlsUrl(currentMusic)}
              autoPlay={isPlaying}
              showControls={true}
              externalAudioRef={audioRef}
            />
          ) : (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">请从播放列表中选择一首歌曲</p>
            </div>
          )}
          
          {/* 单独添加上一首/下一首控制按钮 */}
          {currentMusic && (
            <div className="flex justify-center gap-4 mt-4">
              <button 
                onClick={playPrev} 
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="上一首"
              >
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="px-4 py-2 bg-muted/30 rounded-full">
                <p className="text-sm font-medium truncate max-w-xs">
                  {currentMusic.name}
                </p>
                {currentMusic.artist && (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentMusic.artist}
                  </p>
                )}
              </div>
              
              <button 
                onClick={playNext} 
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="下一首"
              >
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="playlist" className="pt-4">
          {isLoading ? (
            <div className="text-center p-4">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : filteredMusics.length === 0 ? (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground">
                没有找到 HLS 音乐文件，请确保您已将音频文件转换为 HLS 格式。
              </p>
              <p className="text-xs mt-2">
                您可以使用 FFmpeg 将音频文件转换为 HLS 格式：
                <code className="block mt-1 p-2 bg-muted rounded-md text-left">
                  ffmpeg -i input.wav -c:a aac -b:a 192k -hls_time 10 -hls_playlist_type vod -hls_segment_filename "output_%03d.ts" output.m3u8
                </code>
              </p>
            </div>
          ) : (
            <MusicList
              musics={filteredMusics}
              currentMusic={currentMusic}
              isPlaying={isPlaying}
              onSelect={handleSelectMusic}
              onTogglePlay={togglePlay}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 