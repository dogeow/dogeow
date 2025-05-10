'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import HLSMusicPlayer from './HLSMusicPlayer';
import MusicList, { MusicItem } from './MusicList';
import { useMusicStore } from '@/stores/musicStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

// 加载音乐列表的 fetcher 函数
const fetcher = (url: string) => fetch(url).then(res => res.json());

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
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${currentMusic.path}`}
              title={currentMusic.name}
              autoPlay={isPlaying}
              onNext={playNext}
              onPrev={playPrev}
            />
          ) : (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">请从播放列表中选择一首歌曲</p>
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